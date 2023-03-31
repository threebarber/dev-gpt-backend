const Prompt = require("./prompt");
const express = require("express");
const Filter = require('bad-words');

const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();
const filter = new Filter();

app.use(express.static("build"));

const requestLogger = (request, response, next) => {
  console.log("Method:", request.method);
  console.log("Path:  ", request.path);
  console.log("---");
  next();
};

app.use(requestLogger);

app.use(express.json());

/*get answer to prompt*/

app.post("/api/ai", async (req, res) => {
  const prompt = req.body.prompt;
  console.log(`[TimeStamp] [${new Date().toLocaleString()}] [PROMPT] ${prompt}`)
  try {
    if (prompt == null || prompt == "" || prompt == " ") {
      return res.status(401).send("No prompt provided");
    }else if(filter.isProfane(prompt)){
      console.log("Profanity in prompt")
      return res.status(401).send("Profanity in prompt");
    }

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `
        Explain this code snippet utilizing as few tokens as possible:
        
        ${prompt}
        `,
    });

    const completion = response.data.choices[0].text;

    Prompt.init()

    const newPrompt = new Prompt({
      promptText: prompt,
      promptAnswer: completion
    })

    newPrompt.save().then(savedPrompt => {
      console.log(`Saved Exchange: ${savedPrompt}`)
    })

    return res.status(200).json({
      success: true,
      message: completion,
      max_tokens: 300,
    });

  } catch (error) {
    console.log(error.message);
    return res.status(401).send(error.message);
  }
});

app.get('/api/prompts', (request, response) => {
  Prompt.find().sort({ _id: -1 }).limit(4).then(prompts => {
    response.json(prompts)
  })

  
})

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
