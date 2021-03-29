require('auto-api');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const { randomOf } = require('@reverse/random');

// question scraper
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

  await page.setViewport({ width: 800, height: 50000 })

  const lastQuestion = await page.evaluate('document.querySelectorAll("h3")[0].querySelector("dco").innerHTML.replace(/&nbsp; \\n/, " ")');

  if(savedLastQuestion === 'newest') {
    savedLastQuestion = lastQuestion;
    fs.writeFileSync('data/last-question', lastQuestion)
  }

  let hitEdgeCase = false;

  if (lastQuestion !== savedLastQuestion) {
    const js = `
      (() => {
        const anchorDate = new Date('${savedLastQuestion.replace(/\'/g, '\\\'')}');
        const h3 = [...document.querySelectorAll('h3')].filter(x => x.querySelector('dco'));
        let index = h3.findIndex(x => {
          return new Date(x.querySelector('dco').innerHTML.replace(/(&nbsp;|\\s|\\n)+/, " ").trim()) <= anchorDate;
        });
        let hitEdgeCase = false;
        if (index <= 0) {
          // edge case: no anchor question, find nearest.
          index = 5;
          hitEdgeCase = true;
        }
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
          return {start, end, dco: x.querySelector('dco').innerHTML,links,hitEdgeCase}
        });
      })()
    `;

    const questionRanges = await page.evaluate(js);

    for (let i = 0; i < questionRanges.length; i++) {
      const range = questionRanges[i];
      if(range.hitEdgeCase) hitEdgeCase = true;
      const dateMatch = /(.?.)\.(.?.)\.(.?.)\s*(?:&nbsp;)*\s*\n?(.?.):(.?.)\s*(?:&nbsp;)*\s*\n?(am|pm)/.exec(range.dco);
      let questionNumber;
      try {
        questionNumber =
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
      } catch (error) {
        console.log('Choking on question:', range);
        continue;
      }
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

  browser.close();
  return { questions: returnValue.reverse(), hitEdgeCase };
}

// part of code to do the actual discord stuff / interface with the bot
Meta({
  name: 'r/BillWurtz exclusive: Question Fetcher',
  desc: 'Fetches and screenshots questions from billwurtz.com'
});
FeatureAllowed((guild) => {
  return guild.id === '516410163230539837' || guild.id === '366510359370137610';
});

const getConfig = Config({
  questionChannel: {
    type: 'channel',
    default: '811806632606171156',
    // default: '661561881160450060',
    desc: 'Where to send questions.'
  },
});

const allowedUsers = [
  '244905301059436545', // dave
  '587633666071592980', // broochycat
  '469126234345832460', // timmy
  '430551674533314580', // gee
];
const ONE_HOUR = 3600 * 1000;

let running = false;

async function questionFetch(guild) {
  if(running) return;
  running = true;
  try {
    const config = getConfig(guild);
    const channel = config.questionChannel;
    if(!channel || channel.type !== 'text') { return; }

    const { questions: originalQuestions, hitEdgeCase } = await getNewQuestions();
    const questions = originalQuestions.slice(-50);
    if (questions.length > 0) {
      await channel.send(`${Emotes.bill_talking_pento} **New Questions!** ${Emotes.bill_breakfast}`);
      if (originalQuestions.length > 50) {
        await channel.send(`Note: # of questions has been capped at 50, see bill's site for any more questions.`);
      }
      if (hitEdgeCase) {
        await channel.send(`Couldn't find where I left off at, just showing the 5 most recent questions. broochy, can you fix me?`);
      }
      for (let i = 0; i < questions.length; i++) {
        const { date, image, url, links } = questions[i];

        await channel.send(`**${date}** - ${url}${links.length > 0 ? '\n' + links.join('\n') : ''}`, {
          files: [image]
        });
      }
      await channel.send(`${Emotes.bill_damien_arms_yay}${Emotes.bill_sun} that's all folks, for now... ${randomOf([Emotes.bill_bye,Emotes.bill_bye_japan])}`);
      await fs.emptyDir('data/questions');
    }
  } catch (error) {
    console.error(error)
  }
  running = false
}

OnInterval(questionFetch, ONE_HOUR)

function Cooldown(seconds) {
  const cooldown = new CacheMap({ ttl: seconds })
  return ({ msg, next }, ...args) => {
    const v = cooldown.get(0);
    if(v) {
      if(v === 1) {
        msg.react(randomOf([Emotes.clock_rotate, Emotes.bill_slow_down]))
        cooldown.map.get(0).value = 2;
      }
    } else {
      cooldown.set(0, 1)
      next(...args);
    }
  }
}

CommandHandler(/^questions$/, UserWhitelist(allowedUsers), Cooldown(500), ({ msg }) => {
  questionFetch(msg.guild);
  msg.react(Emotes.bill_ok_sure);
});
