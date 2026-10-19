import { describe, expect, it } from 'vitest'
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  resolveLocale,
  createTranslator,
  LOCALE_LABELS,
} from '../src/i18n/index.js'
import { getEditorAction } from '../src/toolbar/editor-actions.js'

describe('i18n', () => {
  it('supports hu, en, de, es, it', () => {
    expect(SUPPORTED_LOCALES).toEqual(['hu', 'en', 'de', 'es', 'it'])
    expect(DEFAULT_LOCALE).toBe('hu')
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy()
    }
  })

  it('resolveLocale normalizes tags and falls back to hu', () => {
    expect(resolveLocale('en')).toBe('en')
    expect(resolveLocale('en-US')).toBe('en')
    expect(resolveLocale('DE')).toBe('de')
    expect(resolveLocale('xx')).toBe('hu')
  })

  it('createTranslator returns localized action labels', () => {
    const tHu = createTranslator('hu')
    const tEn = createTranslator('en')
    expect(getEditorAction('bold', tHu)?.label).toBe('Félkövér')
    expect(getEditorAction('bold', tEn)?.label).toBe('Bold')
    expect(tEn('heading.level', { level: 2 })).toBe('Heading 2')
  })
})
