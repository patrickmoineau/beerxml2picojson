const fs = require("fs");
const convert = require("xml-js");
const uuid = require("uuid");
const formidable = require("formidable");
const http = require("http");
const PORT = process.env.PORT || 8080;

var sendString;
var outData;

http
  .createServer(function (req, res) {
    if (req.url == "/fileupload") {
      var form = new formidable.IncomingForm();
      form.parse(req, function (err, fields, files) {
        sendString = xmlToJsonRecipe(files.filetoupload.path);
        console.log(sendString["name"]);
        console.log(sendString["content"]);
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Content-disposition": `attachment; filename=${sendString["name"]}.json`,
          "Content-Length": sendString["content"].length,
        });
        res.write(sendString["content"]);
        res.end();
      });
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(
        '<form action="fileupload" method="post" enctype="multipart/form-data">'
      );
      res.write('<input type="file" name="filetoupload"><br>');
      res.write('<input type="submit">');
      res.write("</form>");
      return res.end();
    }
  })
  .listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
  });

function xmlToJsonRecipe(fileName) {
  const xmlFile = fs.readFileSync(fileName, "utf8");

  const jsonData = JSON.parse(
    convert.xml2json(xmlFile, { compact: true, spaces: 2 })
  );

  var recipe = {};
  var mashArray = [];
  var hopArray = [];

  recipe["clean"] = false;
  recipe["id"] = uuid.v1().split("-").join("");
  recipe["name"] = jsonData.RECIPES.RECIPE.NAME._text;
  recipe["steps"] = [];

  if (jsonData.RECIPES.RECIPE.MASH.MASH_STEPS.MASH_STEP.length == null) {
    mashArray.push(jsonData.RECIPES.RECIPE.MASH.MASH_STEPS.MASH_STEP);
  } else {
    mashArray = jsonData.RECIPES.RECIPE.MASH.MASH_STEPS.MASH_STEP;
  }
  if (jsonData.RECIPES.RECIPE.HOPS.HOP.length == null) {
    hopArray.push(jsonData.RECIPES.RECIPE.HOPS.HOP);
  } else {
    hopArray = jsonData.RECIPES.RECIPE.HOPS.HOP;
  }

  mashArray.forEach((step) => {
    let heatTo = {
      drain_time: 0,
      location: "PassThru",
      name: `Heat to ${step.NAME._text}`,
      step_time: 0,
      temperature: Number(
        ((Number(step.STEP_TEMP._text) * 9) / 5 + 32).toFixed(0)
      ),
    };
    let thisStep = {
      drain_time: 8,
      location: "Mash",
      name: `${step.NAME._text}`,
      step_time: Number(step.STEP_TIME._text),
      temperature: Number(
        ((Number(step.STEP_TEMP._text) * 9) / 5 + 32).toFixed(0)
      ),
    };
    recipe["steps"].push(heatTo);
    recipe["steps"].push(thisStep);
  });

  var adj1 = {};
  adj1["boil time"] = 999;
  adj1["name"] = "Adjunct1";
  adj1["use"] = "";
  adj1["steps"] = [];
  var adj2 = {};
  adj2["boil time"] = 999;
  adj2["name"] = "Adjunct2";
  adj2["use"] = "";
  adj2["steps"] = [];
  var adj3 = {};
  adj3["boil time"] = 999;
  adj3["name"] = "Adjunct3";
  adj3["use"] = "";
  adj3["steps"] = [];
  var adj4 = {};
  adj4["boil time"] = 999;
  adj4["name"] = "Adjunct4";
  adj4["use"] = "";
  adj4["steps"] = [];

  var isBoil = false;

  hopArray.forEach((step) => {
    if (step.USE._text == "First Wort") {
      if (!isBoil) {
        var boil = {
          drain_time: 0,
          location: "Adjunct1",
          name: "First Wort",
          step_time: 0,
          temperature: 207,
        };
        recipe["steps"].push(boil);
        isBoil = true;
      }
      var firstWort = {
        drain_time: 0,
        location: "Adjunct1",
        name: "First Wort",
        step_time: Number(jsonData.RECIPES.RECIPE.BOIL_TIME._text),
        temperature: 207,
      };
      adj1["boil time"] = Number(jsonData.RECIPES.RECIPE.BOIL_TIME._text);
      adj1["use"] = "First Wort";
      adj1["steps"].push(firstWort);
    }
    if (step.USE._text == "Boil" || step.USE._text == "Aroma") {
      if (adj1["steps"] == 0 || adj1["boil time"] == Number(step.TIME._text)) {
        let addition = {
          drain_time: 0,
          location: adj1["name"],
          name: `${step.TIME._text} min - ${step.NAME._text}`,
          step_time: Number(step.TIME._text),
          temperature: 207,
        };
        adj1["steps"].push(addition);
        if (adj1["boil time"] == 999) {
          adj1["boil time"] = Number(step.TIME._text);
          adj1["use"] = step.USE._text;
        }
      } else if (
        adj2["steps"] == 0 ||
        adj2["boil time"] == Number(step.TIME._text)
      ) {
        let addition = {
          drain_time: 0,
          location: adj2["name"],
          name: `${step.TIME._text} min - ${step.NAME._text}`,
          step_time: Number(step.TIME._text),
          temperature: 207,
        };
        adj2["steps"].push(addition);
        if (adj2["boil time"] == 999) {
          adj2["boil time"] = Number(step.TIME._text);
          adj2["use"] = step.USE._text;
        }
      } else if (
        adj3["steps"] == 0 ||
        adj3["boil time"] == Number(step.TIME._text)
      ) {
        let addition = {
          drain_time: 0,
          location: adj3["name"],
          name: `${step.TIME._text} min - ${step.NAME._text}`,
          step_time: Number(step.TIME._text),
          temperature: 207,
        };
        adj3["steps"].push(addition);
        if (adj3["boil time"] == 999) {
          adj3["boil time"] = Number(step.TIME._text);
          adj3["use"] = step.USE._text;
        }
      } else if (
        adj4["steps"] == 0 ||
        adj4["boil time"] == Number(step.TIME._text)
      ) {
        let addition = {
          drain_time: 0,
          location: adj4["name"],
          name: `${step.TIME._text} min - ${step.NAME._text}`,
          step_time: Number(step.TIME._text),
          temperature: 207,
        };
        adj4["steps"].push(addition);
        if (adj4["boil time"] == 999) {
          adj4["boil time"] = Number(step.TIME._text);
          adj4["use"] = step.USE._text;
        }
      }
    }
  });

  if (!isBoil) {
    var heatToBoil = {
      drain_time: 0,
      location: "PassThru",
      name: "Heat to Boil",
      step_time: 0,
      temperature: 207,
    };
    recipe["steps"].push(heatToBoil);
  }
  if (adj4["boil time"] === 999) {
    adj4["boil time"] = 0;
  }
  if (adj3["steps"].length > 0 && adj4["steps"].length > 0) {
    adj3["boil time"] = adj3["boil time"] - adj4["boil time"];
    adj3["steps"].forEach((step, index) => {
      adj3["steps"][index]["step_time"] = adj3["boil time"];
    });
  }
  if (adj2["steps"].length > 0 && adj3["steps"].length > 0) {
    adj2["boil time"] =
      adj2["boil time"] - (adj3["boil time"] + adj4["boil time"]);
    adj2["steps"].forEach((step, index) => {
      adj2["steps"][index]["step_time"] = adj2["boil time"];
    });
  }
  if (adj1["steps"].length > 0 && adj2["steps"].length > 0) {
    adj1["boil time"] =
      adj1["boil time"] -
      (adj2["boil time"] + adj3["boil time"] + adj4["boil time"]);
    adj1["steps"].forEach((step, index) => {
      adj1["steps"][index]["step_time"] = adj1["boil time"];
    });
  }

  if (adj1["steps"].length > 0) {
    recipe["steps"].push(adj1["steps"][0]);
  }
  if (adj2["steps"].length > 0) {
    recipe["steps"].push(adj2["steps"][0]);
  }
  if (adj3["steps"].length > 0) {
    recipe["steps"].push(adj3["steps"][0]);
  }
  if (adj4["steps"].length > 0) {
    recipe["steps"].push(adj4["steps"][0]);
  }

  outData = JSON.stringify(recipe);
  // fs.writeFile(`${recipe["name"]}.json`, outData, (err) => {
  //   if (err) {
  //     throw err;
  //   }
  //   return `${recipe["name"]}.json saved`;
  // });
  return { content: outData, name: recipe["name"] };
}
