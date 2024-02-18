const axios = require("axios");
require("dotenv").config();

exports.chatGPT = async (req, res) => {
    const { content, messages } = req.body;
    const data = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: content,
        },
      ],
    };
  
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          ...data,
          messages: [...data.messages, ...messages],
        }),
      });
      const json = await response.json();
      const temp = JSON.stringify(json);
      console.log(temp);
      return res.status(200).json({ question: messages, answer: json.choices });
    } catch (error) {
      console.log(error, "error");
    }
  }

  exports.chatGPTSummarizer = async(content, messages)=>{
    const data = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: content,
        },
      ],
    };
  
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          ...data,
          messages: [...data.messages, ...messages],
        }),
      });
      const json = await response.json();
      // const temp = JSON.stringify(json);
      return json.choices[0].message.content;
    } catch (error) {
      console.log(error, "error");
    }
  }