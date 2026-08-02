export default async function handler(req, res) {
  try {
    const token = process.env.BROWSERLESS_TOKEN;

    if (!token) {
      return res.status(500).json({ error: "Missing BROWSERLESS_TOKEN" });
    }

    const browserlessURL = `https://production-sfo.browserless.io/function?token=${token}`;

    const code = `
      export default async ({ page }) => {
        await page.goto(
          "https://varq.net/en/servers/counter-strike-1.6/91.211.247.50:27015/players?match=JMR&sort=score&DESC",
          { waitUntil: "domcontentloaded" }
        );

        const players = await page.evaluate(() => {
          const blocks = [...document.querySelectorAll(".srvPage-topI2")];

          return blocks.map((block) => {
            const cols = block.querySelectorAll(".srvPage-topI2Col");

            const rank =
              cols[0]?.querySelector(".srvPage-topI2Pos")?.textContent?.trim()?.replace(".", "") || "";

            const name =
              cols[0]?.querySelector("a.srvPage-topI2PropValue")?.textContent?.trim() || "";

            const firstColValues = cols[0]
              ? [...cols[0].querySelectorAll(".srvPage-topI2PropValue")].map(el => el.textContent.trim())
              : [];

            const lastSeen = firstColValues[firstColValues.length - 1] || "";

            const secondProps = cols[1]
              ? [...cols[1].querySelectorAll(".srvPage-topI2Prop")]
              : [];

            const score =
              secondProps[0]?.querySelector(".srvPage-topI2PropValue")?.textContent?.trim() || "";

            const playTime =
              secondProps[1]?.querySelector(".srvPage-topI2PropValue")?.textContent?.trim() || "";

            const scorePerHour =
              secondProps[2]?.querySelector(".srvPage-topI2PropValue")?.textContent?.trim() || "";

            return {
              rank,
              name,
              lastSeen,
              score,
              playTime,
              scorePerHour
            };
          });
        });

        return {
          data: players,
          type: "application/json"
        };
      };
    `;

    const response = await fetch(browserlessURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/javascript"
      },
      body: code
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(500).json({
        error: "Browserless request failed",
        details: text
      });
    }

    const result = JSON.parse(text);
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
