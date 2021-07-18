enum ApplicationCommandOptionTypes {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9,
}

export class Argument {
  constructor(
    protected readonly name: string,
    protected readonly description: string,
    protected readonly type: ApplicationCommandOptionTypes
  ) {}

  protected choices?: any[];
  protected options?: any[];
  protected required?: boolean;

  setRequired() {
    this.required = true;
    return this;
  }
}

export class StringArgument extends Argument {
  constructor(name: string, description: string) {
    super(name, description, ApplicationCommandOptionTypes.STRING);
  }

  addChoice(name: string, value: string) {
    if (!this.choices) this.choices = [];
    this.choices.push({ name, value });
    return this;
  }
}

export class IntegerArgument extends Argument {
  constructor(name: string, description: string) {
    super(name, description, ApplicationCommandOptionTypes.INTEGER);
  }

  addChoice(name: string, value: number) {
    if (!this.choices) this.choices = [];
    this.choices.push({ name, value });
    return this;
  }
}

export class BooleanArgument extends Argument {
  constructor(name: string, description: string) {
    super(name, description, ApplicationCommandOptionTypes.BOOLEAN);
  }
}

export class ChannelArgument extends Argument {
  constructor(name: string, description: string) {
    super(name, description, ApplicationCommandOptionTypes.CHANNEL);
  }
}

export class MentionableArgument extends Argument {
  constructor(name: string, description: string) {
    super(name, description, ApplicationCommandOptionTypes.MENTIONABLE);
  }
}

export class RoleArgument extends Argument {
  constructor(name: string, description: string) {
    super(name, description, ApplicationCommandOptionTypes.ROLE);
  }
}

export class UserArgument extends Argument {
  constructor(name: string, description: string) {
    super(name, description, ApplicationCommandOptionTypes.USER);
  }
}
