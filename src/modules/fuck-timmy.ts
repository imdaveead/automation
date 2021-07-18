import { Command } from 'autobot';

export const QuestionFuckshit = Command(
  {
    name: 'questions',
    description: 'ok fine timmy  heres your damn question thing',
    options: [],
  },
  function () {
    this.reply({
      content: `ok tim my guy heres the fuckn questions. go read them yourself\nhttps://billwurtz.com/questions/questions.html`,
    });
  }
);
