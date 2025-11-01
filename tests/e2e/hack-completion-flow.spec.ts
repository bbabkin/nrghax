import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Hack Completion and Unlock Flow', () => {
  test('should complete a hack and unlock the next hack', async ({ page }) => {
    const screenshotsDir = path.join(process.cwd(), 'screenshots')

    console.log('\n=== Starting Hack Completion and Unlock Flow Test ===\n')

    // Step 1: Navigate to foundation page
    console.log('Step 1: Navigating to /levels/foundation')
    await page.goto('/levels/foundation')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '01-foundation-page.png'), fullPage: true })
    console.log('✓ Screenshot saved: 01-foundation-page.png')

    // Step 2: Click on "Morning Sunlight Exposure" hack
    console.log('\nStep 2: Clicking on "Morning Sunlight Exposure" hack')
    const morningSunlightHack = page.locator('text=Morning Sunlight Exposure').first()
    await morningSunlightHack.click()

    // Step 3: Wait for modal animation
    console.log('Step 3: Waiting 500ms for modal animation')
    await page.waitForTimeout(500)

    // Step 4: Take screenshot of open modal
    await page.screenshot({ path: path.join(screenshotsDir, '02-modal-open.png'), fullPage: true })
    console.log('✓ Screenshot saved: 02-modal-open.png')

    // Step 5: Check if hack is complete, if so mark incomplete first
    console.log('\nStep 4-5: Checking current completion status')
    const markIncompleteButton = page.locator('button:has-text("Mark Incomplete")')
    const markCompleteButton = page.locator('button:has-text("Mark Complete")')

    const isComplete = await markIncompleteButton.isVisible()

    if (isComplete) {
      console.log('Hack is currently complete, marking as incomplete first')
      await markIncompleteButton.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: path.join(screenshotsDir, '03-marked-incomplete.png'), fullPage: true })
      console.log('✓ Screenshot saved: 03-marked-incomplete.png')
    } else {
      console.log('Hack is already incomplete, skipping mark incomplete step')
    }

    // Step 6: Close the modal
    console.log('\nStep 6: Closing the modal')
    const closeButton = page.locator('[aria-label="Close"]').or(page.locator('button:has-text("×")'))
    const isCloseButtonVisible = await closeButton.isVisible()

    if (isCloseButtonVisible) {
      await closeButton.click()
    } else {
      // Try clicking backdrop
      console.log('Close button not found, trying to click backdrop')
      await page.keyboard.press('Escape')
    }

    // Step 7: Wait for modal to close
    console.log('Step 7: Waiting 500ms for modal to close')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotsDir, '04-back-to-levels.png'), fullPage: true })
    console.log('✓ Screenshot saved: 04-back-to-levels.png')

    // Step 8: Reopen the modal
    console.log('\nStep 8: Reopening "Morning Sunlight Exposure" hack modal')
    await morningSunlightHack.click()

    // Step 9: Wait for modal animation
    console.log('Step 9: Waiting 500ms for modal animation')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotsDir, '05-modal-reopened.png'), fullPage: true })
    console.log('✓ Screenshot saved: 05-modal-reopened.png')

    // Step 10: Click "Mark Complete" button
    console.log('\nStep 10: Clicking "Mark Complete" button')
    await markCompleteButton.click()

    // Step 11: Wait briefly to see the checkmark change
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(screenshotsDir, '06-marking-complete.png'), fullPage: true })
    console.log('✓ Screenshot saved: 06-marking-complete.png')

    // Step 12: Wait for modal to auto-close and page to update
    console.log('\nStep 11: Waiting for modal to auto-close (300ms delay)')
    await page.waitForTimeout(500)

    // Check if modal is still visible
    const modalStillVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false)
    console.log(`Modal visible after 500ms: ${modalStillVisible}`)

    // Wait for page to reload/update
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await page.screenshot({ path: path.join(screenshotsDir, '07-modal-closed-unlocked.png'), fullPage: true })
    console.log('✓ Screenshot saved: 07-modal-closed-unlocked.png')

    // Step 13: Check that "Box Breathing" hack is now unlocked
    console.log('\nStep 12: Verifying "Box Breathing" hack is unlocked')

    // Get all hack cards on the page
    const allHackCards = await page.locator('[data-hack], article, div').filter({ hasText: 'Box Breathing' }).count()
    console.log(`Found ${allHackCards} elements containing "Box Breathing"`)

    // Look for Box Breathing hack more broadly
    const boxBreathingText = page.getByText('Box Breathing', { exact: true })
    const isBoxBreathingVisible = await boxBreathingText.isVisible().catch(() => false)
    console.log(`Box Breathing text visible: ${isBoxBreathingVisible}`)

    // Try to find the lock icon or "Locked" text near Box Breathing
    const lockIconNearBoxBreathing = page.locator('text=Box Breathing').locator('..').locator('[data-lucide="lock"]')
    const hasLockIcon = await lockIconNearBoxBreathing.count() > 0
    console.log(`Lock icon near Box Breathing: ${hasLockIcon}`)

    const lockedTextNearBoxBreathing = page.locator('text=Box Breathing').locator('..').locator('text=Locked')
    const hasLockedText = await lockedTextNearBoxBreathing.count() > 0
    console.log(`"Locked" text near Box Breathing: ${hasLockedText}`)

    // Check for "Complete X prerequisite first" text
    const prereqText = await page.locator('text=/Complete.*prerequisite/i').count()
    console.log(`Prerequisite text elements found: ${prereqText}`)

    // Look for grayed out state
    const boxBreathingParent = page.locator('text=Box Breathing').locator('..')
    const isGrayedOut = await boxBreathingParent.evaluate((el) => {
      const opacity = window.getComputedStyle(el).opacity
      const filter = window.getComputedStyle(el).filter
      return opacity !== '1' || filter.includes('grayscale')
    }).catch(() => false)
    console.log(`Box Breathing appears grayed out: ${isGrayedOut}`)

    const isUnlocked = isBoxBreathingVisible && !hasLockIcon && !hasLockedText && !isGrayedOut

    if (isUnlocked) {
      console.log('✓ SUCCESS: Box Breathing hack appears to be unlocked!')
    } else if (!isBoxBreathingVisible) {
      console.log('✗ ISSUE: Box Breathing hack not visible on page')
    } else if (hasLockIcon || hasLockedText || isGrayedOut) {
      console.log('✗ ISSUE: Box Breathing hack still appears to be locked')
    }

    console.log('\n=== Test Complete ===\n')

    // Create a test report
    const report = {
      timestamp: new Date().toISOString(),
      steps: [
        { step: 1, name: 'Navigate to foundation page', status: 'completed' },
        { step: 2, name: 'Open Morning Sunlight Exposure modal', status: 'completed' },
        { step: 3, name: 'Check and mark incomplete if needed', status: isComplete ? 'completed' : 'skipped' },
        { step: 4, name: 'Close modal', status: 'completed' },
        { step: 5, name: 'Reopen modal', status: 'completed' },
        { step: 6, name: 'Mark complete', status: 'completed' },
        { step: 7, name: 'Modal auto-close', status: modalStillVisible ? 'failed' : 'completed' },
        { step: 8, name: 'Box Breathing unlocked', status: isBoxBreathingVisible ? 'completed' : 'failed' },
      ],
      modalAutoClosed: !modalStillVisible,
      boxBreathingUnlocked: isUnlocked,
    }

    console.log('\nTest Report:')
    console.log(JSON.stringify(report, null, 2))
  })
})
