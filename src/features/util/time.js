require('auto-api');

Meta({
  name: 'Time',
  desc: 'time'
});

Config({
  timeZone: {
    type: 'string',
    default: 'EST',
    desc: 'Default Time Zone'
  }
})
