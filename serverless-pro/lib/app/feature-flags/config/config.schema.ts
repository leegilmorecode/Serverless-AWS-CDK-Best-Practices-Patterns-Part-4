export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    flagSetDefinition: {
      type: 'object',
      properties: {
        version: {
          $ref: '#/definitions/flagSchemaVersions',
        },
        flags: {
          $ref: '#/definitions/flagDefinitions',
        },
        values: {
          $ref: '#/definitions/flagValues',
        },
      },
      required: ['version', 'flags'],
      additionalProperties: false,
    },
    flagDefinitions: {
      type: 'object',
      patternProperties: {
        '^[a-z][a-zA-Zd-]{0,63}$': {
          $ref: '#/definitions/flagDefinition',
        },
      },
      maxProperties: 100,
      additionalProperties: false,
    },
    flagDefinition: {
      type: 'object',
      properties: {
        name: {
          $ref: '#/definitions/customerDefinedName',
        },
        description: {
          $ref: '#/definitions/customerDefinedDescription',
        },
        _createdAt: {
          type: 'string',
        },
        _updatedAt: {
          type: 'string',
        },
        _deprecation: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['planned'],
            },
          },
          additionalProperties: false,
        },
        attributes: {
          $ref: '#/definitions/attributeDefinitions',
        },
      },
      additionalProperties: false,
    },
    attributeDefinitions: {
      type: 'object',
      patternProperties: {
        '^[a-z][a-zA-Zd-]{0,63}$': {
          $ref: '#/definitions/attributeDefinition',
        },
      },
      maxProperties: 25,
      additionalProperties: false,
    },
    attributeDefinition: {
      type: 'object',
      properties: {
        description: {
          $ref: '#/definitions/customerDefinedDescription',
        },
        constraints: {
          oneOf: [
            { $ref: '#/definitions/numberConstraints' },
            { $ref: '#/definitions/stringConstraints' },
            { $ref: '#/definitions/arrayConstraints' },
            { $ref: '#/definitions/boolConstraints' },
          ],
        },
      },
      additionalProperties: false,
    },
    flagValues: {
      type: 'object',
      patternProperties: {
        '^[a-z][a-zA-Zd-]{0,63}$': {
          $ref: '#/definitions/flagValue',
        },
      },
      maxProperties: 100,
      additionalProperties: false,
    },
    flagValue: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
        },
        _createdAt: {
          type: 'string',
        },
        _updatedAt: {
          type: 'string',
        },
      },
      patternProperties: {
        '^[a-z][a-zA-Zd-]{0,63}$': {
          $ref: '#/definitions/attributeValue',
          maxProperties: 25,
        },
      },
      required: ['enabled'],
      additionalProperties: false,
    },
    attributeValue: {
      oneOf: [
        { type: 'string', maxLength: 1024 },
        { type: 'number' },
        { type: 'boolean' },
        {
          type: 'array',
          oneOf: [
            {
              items: {
                type: 'string',
                maxLength: 1024,
              },
            },
            {
              items: {
                type: 'number',
              },
            },
          ],
        },
      ],
      additionalProperties: false,
    },
    stringConstraints: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['string'],
        },
        required: {
          type: 'boolean',
        },
        pattern: {
          type: 'string',
          maxLength: 1024,
        },
        enum: {
          type: 'array',
          maxLength: 100,
          items: {
            oneOf: [
              {
                type: 'string',
                maxLength: 1024,
              },
              {
                type: 'integer',
              },
            ],
          },
        },
      },
      required: ['type'],
      not: {
        required: ['pattern', 'enum'],
      },
      additionalProperties: false,
    },
    numberConstraints: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['number'],
        },
        required: {
          type: 'boolean',
        },
        minimum: {
          type: 'integer',
        },
        maximum: {
          type: 'integer',
        },
      },
      required: ['type'],
      additionalProperties: false,
    },
    arrayConstraints: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['array'],
        },
        required: {
          type: 'boolean',
        },
        elements: {
          $ref: '#/definitions/elementConstraints',
        },
      },
      required: ['type'],
      additionalProperties: false,
    },
    boolConstraints: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['boolean'],
        },
        required: {
          type: 'boolean',
        },
      },
      required: ['type'],
      additionalProperties: false,
    },
    elementConstraints: {
      oneOf: [
        { $ref: '#/definitions/numberConstraints' },
        { $ref: '#/definitions/stringConstraints' },
      ],
    },
    customerDefinedName: {
      type: 'string',
      pattern: '^[^\\n]{1,64}$',
    },
    customerDefinedDescription: {
      type: 'string',
      maxLength: 1024,
    },
    flagSchemaVersions: {
      type: 'string',
      enum: ['1'],
    },
  },
  type: 'object',
  $ref: '#/definitions/flagSetDefinition',
};
