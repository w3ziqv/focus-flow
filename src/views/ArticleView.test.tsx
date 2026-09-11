import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ArticleView } from "./ArticleView"
import { I18nProvider } from "../lib/i18n"
import { ARTICLES, isStepList, readMinutes } from "../lib/articles"
import { saveLang } from "../lib/storage"

describe("ArticleView Component", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("renders glucose-stability in Polish with 5 ordered step list items and canonical reading time", () => {
    saveLang("pl")
    const onBack = vi.fn()
    const article = ARTICLES["glucose-stability"]
    const expectedReadMin = readMinutes(article, "pl")

    render(
      <I18nProvider>
        <ArticleView topicId="food" articleId="glucose-stability" onBack={onBack} />
      </I18nProvider>,
    )

    // Heading and title
    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading.textContent).toContain(article.titlePl)
    expect(screen.getByText(new RegExp(`${expectedReadMin} min czytania`))).toBeDefined()

    // Section 2 must be rendered as an ordered list of 5 steps
    const listItems = screen.getAllByRole("listitem")
    // 5 step list items + 3 source items = 8 listitems
    expect(listItems.length).toBe(5 + article.sourcesPl.length)

    // Verify first step content
    expect(screen.getByText(/Komponuj posiłki przed blokami pracy/)).toBeDefined()
    // Verify GLUT4 step content (step 3)
    expect(screen.getByText(/transporterów GLUT4/)).toBeDefined()
    // Verify step 4 content is not merged or truncated
    expect(screen.getByText(/Wyeliminuj słodzone napoje/)).toBeDefined()

    // Back button triggers callback
    const backBtn = screen.getByRole("button", { name: /powrót/i })
    fireEvent.click(backBtn)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("renders glucose-stability in English with 5 ordered step list items and canonical reading time", () => {
    saveLang("en")
    const onBack = vi.fn()
    const article = ARTICLES["glucose-stability"]
    const expectedReadMin = readMinutes(article, "en")

    render(
      <I18nProvider>
        <ArticleView topicId="food" articleId="glucose-stability" onBack={onBack} />
      </I18nProvider>,
    )

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading.textContent).toContain(article.titleEn)
    expect(screen.getByText(new RegExp(`${expectedReadMin} min read`))).toBeDefined()

    const listItems = screen.getAllByRole("listitem")
    expect(listItems.length).toBe(5 + article.sourcesEn.length)

    expect(screen.getByText(/Anchor pre-work meals around the metabolic triad/)).toBeDefined()
    expect(screen.getByText(/GLUT4 translocation/)).toBeDefined()
    expect(screen.getByText(/Eliminate sweetened drinks/)).toBeDefined()
  })

  it("correctly handles non-step prose articles such as sleep-protocol without crashing or false list item generation", () => {
    saveLang("pl")
    const onBack = vi.fn()
    const article = ARTICLES["sleep-protocol"]

    render(
      <I18nProvider>
        <ArticleView topicId="sleep" articleId="sleep-protocol" onBack={onBack} />
      </I18nProvider>,
    )

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading.textContent).toContain(article.titlePl)
    // Only sources should be listitems, section 2 stays a prose paragraph
    const listItems = screen.getAllByRole("listitem")
    expect(listItems.length).toBe(article.sourcesPl.length)
    expect(screen.getByText(/Dzień 1–2: stała pora kładzenia się/)).toBeDefined()
  })

  it("returns null when articleId is not found", () => {
    const onBack = vi.fn()
    const { container } = render(
      <I18nProvider>
        <ArticleView topicId="learning" articleId="non-existent-article" onBack={onBack} />
      </I18nProvider>,
    )
    expect(container.firstChild).toBeNull()
  })
})

describe("isStepList utility function", () => {
  it("returns null for non-numbered prose", () => {
    expect(isStepList("To jest zwykły akapit tekstu bez numeracji.")).toBeNull()
    expect(isStepList("")).toBeNull()
    expect(isStepList("Dzień 1: coś tam. Dzień 2: coś innego.")).toBeNull()
  })

  it("returns null when only a single step exists", () => {
    expect(isStepList("1. Tylko jeden krok.")).toBeNull()
  })

  it("handles numbered steps cleanly and ignores numbers within words", () => {
    const text = "1. Krok pierwszy z GLUT4. 2. Krok drugi."
    const result = isStepList(text)
    expect(result).toEqual(["Krok pierwszy z GLUT4.", "Krok drugi."])
  })

  it("handles sentences ending with isolated numbers without false step splitting", () => {
    const text = "1. Krok pierwszy. 2. Wykonaj wariant 2. 3. Krok trzeci."
    const result = isStepList(text)
    expect(result).toEqual(["Krok pierwszy.", "Wykonaj wariant 2.", "Krok trzeci."])
  })

  it("handles steps ending in quotes or parentheses before the next step", () => {
    const text = '1. Zastosuj regułę „jeśli... to...”. 2. Sprawdź efekt (np. w notatkach). 3. Krok końcowy.'
    const result = isStepList(text)
    expect(result).toEqual([
      'Zastosuj regułę „jeśli... to...”.',
      'Sprawdź efekt (np. w notatkach).',
      'Krok końcowy.',
    ])
  })

  it("handles multiline step lists with LF and CRLF line breaks without terminal punctuation", () => {
    const textLf = "1. Zrób pierwszy krok\n2. Zrób drugi krok\n3. Zrób trzeci krok"
    expect(isStepList(textLf)).toEqual([
      "Zrób pierwszy krok",
      "Zrób drugi krok",
      "Zrób trzeci krok",
    ])

    const textCrlf = "1. First line\r\n2. Second line\r\n3. Third line"
    expect(isStepList(textCrlf)).toEqual([
      "First line",
      "Second line",
      "Third line",
    ])
  })

  it("handles steps ending with square brackets and guillemets", () => {
    const textBrackets = "1. Protokół [A] 2. Protokół [B] 3. Protokół [C]"
    expect(isStepList(textBrackets)).toEqual([
      "Protokół [A]",
      "Protokół [B]",
      "Protokół [C]",
    ])

    const textGuillemets = "1. Cytat «Alfa» 2. Cytat «Beta» 3. Cytat «Gamma»"
    expect(isStepList(textGuillemets)).toEqual([
      "Cytat «Alfa»",
      "Cytat «Beta»",
      "Cytat «Gamma»",
    ])
  })

  it("handles multiline step lists with blank lines and indentation", () => {
    const text = "1. Krok pierwszy\n\n  2. Krok drugi\n\n  3. Krok trzeci"
    expect(isStepList(text)).toEqual([
      "Krok pierwszy",
      "Krok drugi",
      "Krok trzeci",
    ])
  })
})



