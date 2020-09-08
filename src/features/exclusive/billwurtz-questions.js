const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const { MessageAttachment } = require('discord.js');

const ONE_HOUR = 3600 * 1000;

fs.ensureDirSync('data/questions');
let savedLastQuestion
try {
  savedLastQuestion = fs.readFileSync('data/last-question').toString().replace(/\n/g, ' ').trim();
} catch (error) {
  savedLastQuestion = 'newest';
}

async function getNewQuestions() {
  const returnValue = [];

  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.goto('https://billwurtz.com/questions/questions.html');
  
  await page.setViewport({ width: 800, height: 10000 })

  const lastQuestion = await page.evaluate('document.querySelectorAll("h3")[0].querySelector("dco").innerHTML.replace(/&nbsp; \\n/, " ")');
  
  if(savedLastQuestion === 'newest') {
    savedLastQuestion = lastQuestion;
    fs.writeFileSync('data/last-question', lastQuestion)
  }

  if (lastQuestion !== savedLastQuestion) {
    const js = `
      (() => {
        const h3 = [...document.querySelectorAll('h3')].filter(x => x.querySelector('dco'));
        const index = h3.findIndex(x => x.querySelector('dco').innerHTML.replace(/&nbsp; \\n/, " ").trim() === '${savedLastQuestion.replace(/\'/g, '\\\'')}');
        const questionsToGet = h3.slice(0, index)
        return questionsToGet.map((x, i) => {
          const links = [];
          const start = x.offsetTop
          let s = x;
          [...x.querySelectorAll('a')].forEach(y => { links.push(y.href); })
          do{
            s = s.nextSibling;
            if (s.querySelectorAll) {
              [...s.querySelectorAll('a')].forEach(y => { links.push(y.href); })
            }
            if (s.tagName && s.tagName.toLowerCase() === 'a') {
              links.push(s.href);
            }
          } while(!(s.querySelector && s.querySelector('dco')))
          const end = s.offsetTop;
          return {start, end, dco: x.querySelector('dco').innerHTML,links}
        });
      })()
    `;

    const questionRanges = await page.evaluate(js);

    for (let i = 0; i < questionRanges.length; i++) {
      const range = questionRanges[i];
      const dateMatch = /(.?.)\.(.?.)\.(.?.)&nbsp; ?\n(.?.):(.?.) (am|pm)/.exec(range.dco);
      const questionNumber =
        "20"
        + dateMatch[3]
        + dateMatch[1].padStart(2, "0")
        + dateMatch[2].padStart(2, "0")
        + (
          "am" === dateMatch[6]
            ? (parseInt(dateMatch[4]) % 12).toString()
            : ((parseInt(dateMatch[4]) % 12) + 12).toString()
          ).padStart(2, "0")
        + dateMatch[5];
      await page.screenshot({
        path: 'data/questions/' + questionNumber + '.png',
        clip: {
          y: range.start - 11,
          x: 0,
          width: 800,
          height: (range.end - 22) - (range.start - 22)
        },
      });
      returnValue.push({
        date: range.dco.replace(/&nbsp; \n/, " ").trim(),
        image: 'data/questions/' + questionNumber + '.png',
        url: 'https://billwurtz.com/questions/q.php?date=' + questionNumber,
        questionNumber,
        links: range.links
      });
    }

    savedLastQuestion = lastQuestion;
    fs.writeFileSync('data/last-question', lastQuestion);
  }

  await browser.close();
  return returnValue.reverse();
}

// part of code to do the actual discord stuff / interface with the bot
FeatureAllowed((guild) => {
  return guild.id === '366510359370137610'
});

async function questionFetch(guild) {
  const channel = guild.channels.get('661561881160450060');
  if(!channel || channel.type !== 'text') { return; }

  const questions = await getNewQuestions();
  if (questions.length > 0) {
    await channel.send(`<a:talking_pento:737687712500547644> **New Questions!** <:breakfast:742831142725615627>`);
    for (let i = 0; i < questions.length; i++) {
      const { date, image, url, links } = questions[i];
      
      await channel.send(`**${date}** - ${url}${links.length > 0 ? '\n' + links.join('\n') : ''}`, {
        files: [image]
      });
    }
    await channel.send(`<:damien_arms_point:742555954083659870><a:outside_sun:742446115013787687> that's all folks, for now... <:bye:742555752304214067>`);
    await fs.emptyDir('data/questions');
  }
}

OnInterval(questionFetch, ONE_HOUR)

CommandHandler(/^questions$/, RequiresAdmin, ({ msg }) => {
  questionFetch(msg.guild)
  msg.react('742556391356629062')
})
