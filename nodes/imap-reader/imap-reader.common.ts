import * as z from 'zod'
import { inspect } from 'util'
import { objectUtil } from 'zod/lib/src/helpers/objectUtil'

const Message = z.object({ _msgid: z.string() })

const Schema = {
  flush: Message.extend({
    topic: z.literal('FLUSH.V1'),
  }),
  tick: Message.extend({
    topic: z.literal('FETCH.V1'),
  }),
  email: z.object({
    topic: z.literal('EMAIL.V1'),
    payload: z.object({
      content: z.union([z.string().nonempty(), z.undefined()]),
      labels: z.array(z.string().nonempty()),
      from: z.union([z.string().nonempty(), z.undefined()]),
      to: z.union([z.string().nonempty(), z.undefined()]),
      subject: z.union([z.string().nonempty(), z.undefined()]),
    }),
  }),
  gmail: z
    .object({
      'body[]': z.string().nonempty(),
      'x-gm-labels': z.array(z.string()),
    })
    .nonstrict(),
}

export const actions = z.union([Schema.flush, Schema.tick])
export type Actions = z.infer<typeof actions>
export const isAction = actions.check.bind(actions)
export function upgradeAction(action: any, log: (message: string) => void): z.infer<typeof actions> {
  if ('topic' in action && isString(action.topic)) {
    return action as z.infer<typeof actions>
  }
  log(`Messages like the following will be deprecated ${inspect(action)}`)
  if (action.payload === 'flush') {
    return { topic: 'FLUSH.V1', _msgid: action._msgid }
  }
  return {
    topic: 'FETCH.V1',
    _msgid: action._msgid,
  }
}

export const Event = {
  result(args: Omit<z.infer<typeof Schema.email>, 'topic'>['payload']): z.infer<typeof Schema.email> {
    return { topic: 'EMAIL.V1' as const, payload: args }
  },
}

export const events = Schema.email
export type Events = ReturnType<typeof Event[keyof typeof Event]>
export const isEvent = events.check.bind(events)

function isString(value: unknown): value is string {
  return {}.toString.call(value) === '[object String]'
}

export const isGmailEmail = Schema.gmail.check.bind(Schema.gmail)
