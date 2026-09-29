import { game } from "./documents/game"
import { interfaceDoc } from "./documents/interface"
import { rules } from "./documents/rules"
import { settings } from "./documents/settings"
import { texts } from "./documents/texts"
import { localeString, localeStringList, localeText } from "./objects/locale"

export const schemaTypes = [settings, interfaceDoc, game, rules, texts, localeString, localeText, localeStringList]
