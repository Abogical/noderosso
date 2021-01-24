import * as z from 'zod'
import { inspect } from 'util'

const Message = z.object({ _msgid: z.string() })

const Schema = {
  flush: Message.extend({
    topic: z.literal('FLUSH.V1'),
  }),
  tick: Message.extend({
    topic: z.literal('TICK.V1'),
  }),
  book: Message.extend({
    topic: z.literal('BOOK.V1'),
    payload: z.object({
      date: z.string().nonempty(),
    })
  }),
  confirmedBooking: z.object({
    topic: z.literal('CONFIRMED_BOOKING.V1'),
    payload: z.object({
      date: z.string().nonempty(),
    }),
  }),
}

export const actions = z.union([Schema.flush, Schema.tick, Schema.book])
export type Actions = z.infer<typeof actions>
export const isAction = actions.check.bind(actions)
export function upgradeAction(action: any, log: (message: string) => void): z.infer<typeof actions> {
  return action
}

export const Event = {
  confirmedBooking(args: Omit<z.infer<typeof Schema.confirmedBooking>, 'topic'>['payload']): z.infer<typeof Schema.confirmedBooking> {
    return { topic: 'CONFIRMED_BOOKING.V1' as const, payload: args }
  },
}

export const events = Schema.confirmedBooking
export type Events = ReturnType<typeof Event[keyof typeof Event]>
export const isEvent = events.check.bind(events)

function isString(value: unknown): value is string {
  return {}.toString.call(value) === '[object String]'
}
