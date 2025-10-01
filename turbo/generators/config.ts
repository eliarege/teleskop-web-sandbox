import type { PlopTypes } from '@turbo/gen'

interface PlopAnswers {
  project: string
  teleskop: boolean
  turbo: {
    paths: {
      cwd: string
      root: string
      workspace: string
    }
    configs: unknown[]
  }
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('node-app', {
    description: 'Node Project generator',
    prompts: [
      {
        type: 'input',
        name: 'project',
        message: 'Name of the project (dash-case)',
        validate: (input: string) => {
          const regex = /^[a-z-]+$/
          if (!regex.test(input)) {
            return 'project name must only contain lowercase letters or dashes'
          }
          if (!input) {
            return 'project name is required'
          }
          return true
        },
      },
      {
        type: 'confirm',
        name: 'teleskop',
        message: 'Does this project use teleskop database?',
      },
      {
        type: 'confirm',
        name: 'fastify',
        message: 'Will this be a Fastify project?',
      },
    ],
    actions: [
      {
        type: 'addMany',
        base: 'templates/node-app',
        destination: '{{ turbo.paths.root }}/apps/{{ dashCase project }}',
        templateFiles: 'templates/node-app/**',
        globOptions: {
          ignore: ['**/database.ts'],
        },
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/apps/{{ dashCase project }}/src/database.ts',
        templateFile: 'templates/node-app/src/database.ts',
        skip: (answers: PlopAnswers) => {
          if (!answers.teleskop) {
            return 'skipping database.ts as teleskop is not needed'
          }
        },
      },
    ],
  })
}
