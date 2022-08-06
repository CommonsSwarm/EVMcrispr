import { arrayExpressionParser } from '../../src/cas11/parsers/array';
import type { Case } from '../test-helpers/cas11';
import { runCases } from '../test-helpers/cas11';

export const arrayParserDescribe = (): Mocha.Suite =>
  describe('Array parser', () => {
    it('should parse an array correctly', () => {
      const cases: Case[] = [
        [
          '[    1, "a text string",    3    ]',
          {
            type: 'ArrayExpression',
            elements: [
              { type: 'NumberLiteral', value: 1 },
              { type: 'StringLiteral', value: 'a text string' },
              { type: 'NumberLiteral', value: 3 },
            ],
          },
          'Invalid array match',
        ],
        [
          '[145e18y, @token(DAI), false, ["a string", anIdentifier, [1, 2, [aDeepDeepIdentifier.open]],  $variable], $fDAIx::host()]',
          {
            type: 'ArrayExpression',
            elements: [
              { type: 'NumberLiteral', value: 145, power: 18, timeUnit: 'y' },
              {
                type: 'HelperFunctionExpression',
                name: 'token',
                args: [{ type: 'ProbableIdentifier', value: 'DAI' }],
              },
              { type: 'BoolLiteral', value: false },
              {
                type: 'ArrayExpression',
                elements: [
                  { type: 'StringLiteral', value: 'a string' },
                  { type: 'ProbableIdentifier', value: 'anIdentifier' },
                  {
                    type: 'ArrayExpression',
                    elements: [
                      { type: 'NumberLiteral', value: 1 },
                      { type: 'NumberLiteral', value: 2 },
                      {
                        type: 'ArrayExpression',
                        elements: [
                          {
                            type: 'ProbableIdentifier',
                            value: 'aDeepDeepIdentifier.open',
                          },
                        ],
                      },
                    ],
                  },
                  { type: 'VariableIdentifier', value: '$variable' },
                ],
              },
              {
                type: 'CallExpression',
                target: { type: 'VariableIdentifier', value: '$fDAIx' },
                method: 'host',
                args: [],
              },
            ],
          },
          'Invalid nested array match',
        ],
      ];

      runCases(cases, arrayExpressionParser);
    });
  });
