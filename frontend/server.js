const path = require("path");
const express = require("express");

const app = express();
const port = Number(process.env.PORT || 3000);
const buildDir = path.join(__dirname, "build");

app.use(express.static(buildDir));

// SPA fallback — necessário para /login, /home, /tickets etc.
app.get("*", (req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ISPCHAT frontend (SPA) on :${port}`);
});
