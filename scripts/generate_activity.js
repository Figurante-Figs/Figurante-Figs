const fs = require("fs");

const username = process.env.GITHUB_OWNER;

async function main() {
    const query = `
    query($login: String!) {
        user(login: $login) {
            contributionsCollection {
                contributionCalendar {
                    totalContributions
                    weeks {
                        contributionDays {
                            date
                            contributionCount
                        }
                    }
                }
            }
        }
    }`;

    const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            "User-Agent": "Lyco-Activity-Monitor"
        },
        body: JSON.stringify({
            query,
            variables: { login: username }
        })
    });

    const data = await response.json();

    if (data.errors) {
        throw new Error(JSON.stringify(data.errors));
    }

    const calendar =
        data.data.user.contributionsCollection.contributionCalendar;

    const weeks = calendar.weeks;

    const width = 1000;
    const height = 430;

    const cellSize = 14;
    const gap = 4;

    const graphX = 55;
    const graphY = 90;

    const levels = [
        "░",
        "▒",
        "▓",
        "█"
    ];

    function level(count) {
        if (count === 0) return 0;
        if (count <= 2) return 1;
        if (count <= 5) return 2;
        return 3;
    }

    function escape(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    let cells = "";

    weeks.forEach((week, x) => {
        week.contributionDays.forEach((day) => {
            const date = new Date(day.date + "T00:00:00");

            const weekday = date.getDay();

            const px = graphX + x * (cellSize + gap);
            const py = graphY + weekday * (cellSize + gap);

            const value = levels[level(day.contributionCount)];

            cells += `
                <text
                    x="${px}"
                    y="${py + 12}"
                    class="cell level-${level(day.contributionCount)}"
                >${value}</text>
            `;
        });
    });

    const total = calendar.totalContributions;

    const now = new Date();

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}"
     viewBox="0 0 ${width} ${height}">

<style>
    text {
        font-family:
            "JetBrains Mono",
            "Fira Code",
            "DejaVu Sans Mono",
            monospace;
    }

    .title {
        fill: #ffffff;
        font-size: 20px;
        font-weight: bold;
    }

    .small {
        fill: #888888;
        font-size: 12px;
    }

    .label {
        fill: #666666;
        font-size: 11px;
    }

    .cell {
        font-size: 16px;
        font-weight: bold;
    }

    .level-0 { fill: #252525; }
    .level-1 { fill: #555555; }
    .level-2 { fill: #999999; }
    .level-3 { fill: #ffffff; }

    .border {
        fill: none;
        stroke: #333333;
        stroke-width: 1;
    }

    .scanline {
        stroke: #ffffff;
        stroke-width: 1;
        opacity: 0.06;
    }

    .cursor {
        fill: #ffffff;
    }
</style>

<rect width="100%" height="100%" fill="#000000"/>

<rect
    x="20"
    y="20"
    width="960"
    height="390"
    class="border"
    rx="2"
    ry="2"
/>

<text x="40" y="55" class="title">
    ACTIVITY MONITOR :: LYCO-SH v2.4
</text>

<text x="40" y="75" class="small">
    user@github:${escape(username)} :: contribution subsystem
</text>

<line x1="40" y1="105" x2="960" y2="105" class="scanline"/>

<text x="40" y="130" class="label">ACTIVITY</text>

${cells}

<line x1="40" y1="265" x2="960" y2="265" class="scanline"/>

<text x="40" y="295" class="small">
    COMMITS / CONTRIBUTIONS
</text>

<text x="40" y="325" class="title">
    ${total}
</text>

<text x="130" y="325" class="small">
    recorded events
</text>

<text x="40" y="355" class="small">
    LAST SCAN ........ ${now.toISOString().replace("T", " ").substring(0, 19)} UTC
</text>

<text x="40" y="380" class="small">
    STATUS ........... ONLINE
</text>

<text x="40" y="402" class="small">
    MEMORY ........... external redundancy enabled
</text>

<rect
    x="948"
    y="378"
    width="7"
    height="14"
    class="cursor"
/>

</svg>
`;

    fs.mkdirSync("assets", { recursive: true });

    fs.writeFileSync(
        "assets/activity.svg",
        svg.trim(),
        "utf8"
    );

    console.log(`Generated activity.svg for ${username}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
