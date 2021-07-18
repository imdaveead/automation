import { ActionRow, Command, RoleArgument, StringArgument } from 'autobot';
import { MessageSelectMenu } from 'discord.js';

export const RoleMenuCommand = Command(
  {
    name: 'role_menu',
    description: 'test',
    options: [
      new StringArgument('label', 'Display name for this choice').setRequired(),
      new StringArgument('description', 'Description text for this choice').setRequired(),
      new RoleArgument('role', 'Role to assign with this choice').setRequired(),
      new StringArgument('emoji', 'Emoji for this choice (optional)'),
    ],
  },
  function () {
    this.reply('pog');
    // this.reply({
    //   content: `Test`,
    //   components: [
    //     ActionRow(
    //       // {
    //       //   type: 'SELECT_MENU',
    //       //   minValues: 1,
    //       //   maxValues: 10,
    //       //   options: [

    //       //   ],
    //       //   customID: 'test',
    //       //   placeholder: 'Select Roles'
    //       // }
    //       new MessageSelectMenu()
    //         .setPlaceholder('Select Roles')
    //         .setMinValues(0)
    //         .setMaxValues(2)
    //         .setCustomID('test')
    //         .addOptions({
    //           label: 'New Content Notifications',
    //           value: 'A',
    //           description: 'You will recieve notifications for new content',
    //           emoji: '771713873299898399',
    //         })
    //         .addOptions({
    //           label: 'Livestream Notifications',
    //           value: 'B',
    //           description: 'You will recieve notifications for live streams',
    //           emoji: '771713785937264650',
    //         })
    //         .toJSON()
    //     )
    //   ]
    // });
  }
);
