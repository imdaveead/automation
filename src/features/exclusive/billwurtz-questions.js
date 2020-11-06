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

  if (lastQuestion !== savedLastQuestion) {
    const js = `
      (() => {
        const anchorDate = new Date('${savedLastQuestion.replace(/\'/g, '\\\'')}');
        const h3 = [...document.querySelectorAll('h3')].filter(x => x.querySelector('dco'));
        const index = h3.findIndex(x => {
          return new Date(x.querySelector('dco').innerHTML.replace(/(&nbsp;|\\s|\\n)+/, " ").trim()) <= anchorDate;
        });
        if (!index) {
          // edge case: no anchor question, find nearest.
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
          return {start, end, dco: x.querySelector('dco').innerHTML,links}
        });
      })()
    `;

    const questionRanges = await page.evaluate(js);

    for (let i = 0; i < questionRanges.length; i++) {
      const range = questionRanges[i];
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

  await browser.close();
  return returnValue.reverse();
}

// part of code to do the actual discord stuff / interface with the bot
Meta({
  name: 'r/BillWurtz exclusive: Question Fetcher',
  desc: 'Fetches and screenshots questions from billwurtz.com'
});
FeatureAllowed((guild) => {
  return guild.id === '366510359370137610'
});

const getConfig = Config({
  questionChannel: {
    type: 'channel',
    default: '661561881160450060',
    desc: 'Where to send questions.'
  }
});

const allowedUsers = [
  '244905301059436545', // dave
  '576462139909210143', // tornado
  '457294150329434113', // 1ctinus
  '587633666071592980', // broochycat
  '166315539524747266', // Rafunzi
  '430551674533314580', // gee
  '639794240397901825', 
  '562289654947119116', // 
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
  } catch (error) {
    // lol
  }
  running = false
}

// OnInterval(questionFetch, ONE_HOUR)

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
  msg.channel.send('question stuff is gonna be down for now while bot is getting some other features added.')
  // questionFetch(msg.guild)
  // msg.react('742556391356629062')
})
