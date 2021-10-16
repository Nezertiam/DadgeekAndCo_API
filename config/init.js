import fs from "fs";
import execSync from "child_process";

const projectInitialisation = () => {
    console.log("Generating config/default.json...");
    const file = JSON.stringify({
        mongoURI: "",
        jwtSecret: "myscrettoken"
    })
    fs.writeFileSync("config/default.json", file);
    console.log("DONE")

    console.log("Installing dependencies with 'npm install' command...")
    execSync("npm install", { stdio: "inherit" });
    console.log("DONE")

    console.log("Operation finished !");
    console.log("You are now free to remove config/init.js from your project !")
}

projectInitialisation();