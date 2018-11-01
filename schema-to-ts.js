const js2ts = require("json-schema-to-typescript");
const fs = require("fs");
const path = require("path");

// compile from file
/*js2ts.compileFromFile('manifest.json')
  .then(ts => fs.writeFileSync('./src/entities/parsing/json/manifest.d.ts', ts))*/

const files = [
    "manifest.json"
]
//const source = "./node_modules/minecraft-json-schemas/bedrock";
const source = "../minecraft-json-schemas/bedrock";
const destination = "./src/entities/parsing/json";

const options = {
    bannerComment: `/**
    * This file was automatically generated by json-schema-to-typescript.
    * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
    * and run schema-to-ts to regenerate this file.
    */`,

}
Promise.all(
    files.map(
        f => 
            new Promise(
                (r, e) => fs.copyFile(
                    path.join(__dirname, source, f),
                    path.join(__dirname, "./src/schemas", f),
                    (err) => {
                        if(!!err) {
                            e(err);
                        } else {
                            r();
                        }
                    }
                )
            ).then(
            js2ts.compileFromFile(
                path.join(__dirname, source, f),
                options
            )
            .then(
                ts => fs.writeFileSync(path.join(__dirname, destination, f.replace(".json", ".ts")), ts)
            )
            )
    )
);