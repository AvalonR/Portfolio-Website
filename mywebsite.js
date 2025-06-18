const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 8000;

require("dotenv").config();

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    const html = fs.readFileSync(path.join(__dirname, "mywebsite.html"));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } else if (req.url === "/webstyle.css") {
    const css = fs.readFileSync(path.join(__dirname, "webstyle.css"));
    res.writeHead(200, { "Content-Type": "text/css" });
    res.end(css);
  } else if (req.url === "/api/github-profile") {
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: process.env.GITHUB_TOKEN,
        },
      });
      const data = await response.json();
      const publicData = {
        login: data.login,
        name: data.name,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        public_repos: data.public_repos,
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(publicData));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Failed to fetch GitHub data" }));
    }
  } else if (req.url === "/api/github-repos") {
    try {
      const apiRes = await fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: process.env.GITHUB_TOKEN,
        },
      });
      const data = await apiRes.json();
      const repoList = data.map((repo) => ({
        name: repo.name,
        html_url: repo.html_url,
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(repoList));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "GitHub repo fetch failed" }));
    }
  } else if (req.url.startsWith("/api/github-readme")) {
    const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const repo = query.get("repo");
    if (!repo) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing repo parameter" }));
    }

    try {
      const apiRes = await fetch(
        `https://api.github.com/repos/AvalonR/${repo}/readme`,
        {
          headers: {
            Authorization: process.env.GITHUB_TOKEN,
            Accept: "application/vnd.github.v3.raw",
          },
        },
      );

      if (apiRes.status === 404) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: "README not found" }));
      }

      const readme = await apiRes.text();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(readme);
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Failed to fetch README" }));
    }
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
