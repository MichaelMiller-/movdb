import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page
} from '@playwright/test'

const projectRoot = resolve(__dirname, '../..')

interface RunningApplication {
  app: ElectronApplication
  page: Page
  directory: string
}

test('adds a movie through the Browse dialog', async () => {
  const running = await launchApplication()

  try {
    const moviePath = join(running.directory, 'The Matrix.mp4')
    await writeFile(moviePath, '')

    await running.app.evaluate(({ dialog }, filepath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [filepath] })
    }, moviePath)

    await running.page.getByRole('button', { name: 'Browse…' }).click()
    await expect(running.page.getByLabel('Title')).toHaveValue('The Matrix')
    await expect(running.page.locator('input[placeholder="Choose a video file…"]')).toHaveValue(moviePath)

    await running.page.getByRole('button', { name: 'Add movie' }).click()

    const row = running.page.locator('tbody tr').filter({ hasText: 'The Matrix' })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('The Matrix.mp4')
  } finally {
    await closeApplication(running)
  }
})

test('shows 25 movies per page and navigates to the next page', async () => {
  const running = await launchApplication()

  try {
    const movies = []
    for (let index = 1; index <= 26; index += 1) {
      const filename = `movie-${String(index).padStart(2, '0')}.mp4`
      const filepath = join(running.directory, filename)
      await writeFile(filepath, '')
      movies.push({
        title: `Movie ${String(index).padStart(2, '0')}`,
        filepath
      })
    }

    await running.page.evaluate(async (inputs) => {
      for (const input of inputs) {
        await (window as unknown as {
          movieLibrary: { createMovie: (movie: typeof input) => Promise<unknown> }
        }).movieLibrary.createMovie(input)
      }
    }, movies)

    await running.page.reload()

    await expect(running.page.locator('tbody tr')).toHaveCount(25)
    await expect(running.page.getByText('Showing 1–25 of 26')).toBeVisible()
    await expect(running.page.getByText('Page 1 of 2')).toBeVisible()
    await expect(running.page.getByLabel('Movie list pagination').locator('select')).toHaveValue('25')

    await running.page.getByRole('button', { name: 'Next' }).click()

    await expect(running.page.locator('tbody tr')).toHaveCount(1)
    await expect(running.page.locator('tbody tr')).toContainText('Movie 26')
    await expect(running.page.getByText('Showing 26–26 of 26')).toBeVisible()
    await expect(running.page.getByText('Page 2 of 2')).toBeVisible()
  } finally {
    await closeApplication(running)
  }
})

async function launchApplication(): Promise<RunningApplication> {
  const directory = await mkdtemp(join(tmpdir(), 'movie-library-e2e-'))
  const userDataDirectory = join(directory, 'user-data')

  const app = await electron.launch({
    cwd: projectRoot,
    args: [`--user-data-dir=${userDataDirectory}`, projectRoot]
  })
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByRole('heading', { name: 'Movie Library' })).toBeVisible()

  return { app, page, directory }
}

async function closeApplication(running: RunningApplication): Promise<void> {
  await running.app.close()
  await rm(running.directory, { recursive: true, force: true })
}
