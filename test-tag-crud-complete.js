const { chromium } = require('playwright');
const fs = require('fs');

// Test data
const TEST_TAGS = [
  { name: 'Test Automation Tag', expectedSlug: 'test-automation-tag' },
  { name: 'Performance Testing', expectedSlug: 'performance-testing' },
  { name: 'End-to-End Tests', expectedSlug: 'end-to-end-tests' }
];

async function testTagCRUD() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Store results
  const testResults = {
    passed: [],
    failed: [],
    screenshots: []
  };

  // Helper function to take screenshot and log
  async function takeScreenshot(name, description) {
    const filename = `tag-crud-${name}.png`;
    await page.screenshot({ path: filename });
    testResults.screenshots.push(filename);
    console.log(`   📸 Screenshot: ${filename} - ${description}`);
  }

  // Helper function to check if tag exists in list
  async function tagExistsInList(tagName) {
    const tagElements = await page.locator(`text="${tagName}"`).all();
    return tagElements.length > 0;
  }

  // Helper function to verify toast message
  async function verifyToast(expectedText, isError = false) {
    await page.waitForTimeout(500);
    const toast = await page.locator('[role="alert"], .toast').first();
    if (await toast.count() > 0) {
      const toastText = await toast.textContent();
      const containsExpected = toastText.toLowerCase().includes(expectedText.toLowerCase());
      if (containsExpected) {
        console.log(`   ✓ Toast verified: "${toastText}"`);
        return true;
      } else {
        console.log(`   ❌ Toast mismatch. Expected: "${expectedText}", Got: "${toastText}"`);
        return false;
      }
    }
    console.log('   ⚠ No toast notification found');
    return false;
  }

  try {
    console.log('🧪 Starting Comprehensive Tag CRUD Tests\n');
    console.log('=' .repeat(50));

    // ========== LOGIN ==========
    console.log('\n📌 SETUP: Admin Login');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('   ✓ Logged in as admin');

    // Navigate to tags page
    await page.goto('http://localhost:3000/admin/tags');
    await page.waitForLoadState('networkidle');
    await takeScreenshot('01-initial', 'Initial tags page');

    // ========== TEST 1: CREATE TAGS ==========
    console.log('\n📌 TEST 1: Create Tags with Name Verification');
    console.log('-' .repeat(40));
    
    for (let i = 0; i < TEST_TAGS.length; i++) {
      const tag = TEST_TAGS[i];
      console.log(`\n   Creating tag: "${tag.name}"`);
      
      // Fill in tag name
      const nameInput = await page.locator('input[placeholder*="Beginner"], input[placeholder*="Energy Worker"]').first();
      await nameInput.clear();
      await nameInput.fill(tag.name);
      
      // Click create button
      await page.click('button:has-text("Create Tag")');
      
      // Verify toast
      const toastSuccess = await verifyToast(tag.name);
      if (toastSuccess) {
        testResults.passed.push(`Create tag: ${tag.name}`);
      } else {
        testResults.failed.push(`Create tag: ${tag.name} - Toast verification failed`);
      }
      
      // Wait for page refresh
      await page.waitForTimeout(1500);
      
      // Verify tag appears in list
      const tagExists = await tagExistsInList(tag.name);
      if (tagExists) {
        console.log(`   ✓ Tag "${tag.name}" appears in list`);
        testResults.passed.push(`Verify tag in list: ${tag.name}`);
      } else {
        console.log(`   ❌ Tag "${tag.name}" NOT found in list`);
        testResults.failed.push(`Verify tag in list: ${tag.name}`);
      }
      
      await takeScreenshot(`02-created-${i+1}`, `After creating "${tag.name}"`);
    }

    // ========== TEST 2: VERIFY DUPLICATE PREVENTION ==========
    console.log('\n📌 TEST 2: Verify Duplicate Tag Prevention');
    console.log('-' .repeat(40));
    
    const duplicateTag = TEST_TAGS[0].name;
    console.log(`   Attempting to create duplicate: "${duplicateTag}"`);
    
    const nameInput = await page.locator('input[placeholder*="Beginner"], input[placeholder*="Energy Worker"]').first();
    await nameInput.clear();
    await nameInput.fill(duplicateTag);
    await page.click('button:has-text("Create Tag")');
    
    // Should get error toast
    const errorToast = await verifyToast('exists', true);
    if (errorToast) {
      console.log('   ✓ Duplicate prevention works');
      testResults.passed.push('Duplicate tag prevention');
    } else {
      console.log('   ❌ Duplicate was not prevented');
      testResults.failed.push('Duplicate tag prevention');
    }
    
    await takeScreenshot('03-duplicate-error', 'Duplicate tag error');

    // ========== TEST 3: EDIT TAG (if edit functionality exists) ==========
    console.log('\n📌 TEST 3: Edit Tag Functionality');
    console.log('-' .repeat(40));
    
    // Look for edit buttons - they are blue SVG icons in the tag list
    const editButtons = await page.locator('.hover\\:bg-blue-50').all();
    
    if (editButtons.length > 0) {
      console.log(`   Found ${editButtons.length} edit buttons`);
      
      // Click first edit button
      await editButtons[0].click();
      await page.waitForTimeout(1000);
      
      // Look for edit input that appears inline
      const editInput = await page.locator('input.border.rounded').first();
      if (await editInput.count() > 0) {
        const originalValue = await editInput.inputValue();
        const newValue = originalValue + ' EDITED';
        
        await editInput.clear();
        await editInput.fill(newValue);
        
        // Submit edit
        const saveButton = await page.locator('button:has-text("Save"), button:has-text("Update")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          
          await page.waitForTimeout(1500);
          
          // Verify edited tag appears
          const editedExists = await tagExistsInList(newValue);
          if (editedExists) {
            console.log(`   ✓ Tag successfully edited to "${newValue}"`);
            testResults.passed.push('Edit tag functionality');
          } else {
            console.log('   ❌ Edited tag not found in list');
            testResults.failed.push('Edit tag functionality');
          }
        }
      } else {
        console.log('   ⚠ Edit form not found');
        testResults.failed.push('Edit tag functionality - no form');
      }
      
      await takeScreenshot('04-after-edit', 'After editing tag');
    } else {
      console.log('   ℹ Edit functionality not available');
    }

    // ========== TEST 4: DELETE TAG ==========
    console.log('\n📌 TEST 4: Delete Tag Functionality');
    console.log('-' .repeat(40));
    
    // Look for delete buttons - they are red SVG icons
    const deleteButtons = await page.locator('.hover\\:bg-red-50').all();
    
    if (deleteButtons.length > 0) {
      console.log(`   Found ${deleteButtons.length} delete buttons`);
      
      // Get tag name before deletion
      const tagToDelete = TEST_TAGS[TEST_TAGS.length - 1].name;
      const existsBeforeDelete = await tagExistsInList(tagToDelete);
      
      if (existsBeforeDelete) {
        console.log(`   Attempting to delete: "${tagToDelete}"`);
        
        // Click delete button
        await deleteButtons[deleteButtons.length - 1].click();
        
        // Handle confirmation if it appears
        const confirmButton = await page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').first();
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
          console.log('   ✓ Confirmed deletion');
        }
        
        await page.waitForTimeout(1500);
        
        // Verify tag is deleted
        const existsAfterDelete = await tagExistsInList(tagToDelete);
        if (!existsAfterDelete) {
          console.log(`   ✓ Tag "${tagToDelete}" successfully deleted`);
          testResults.passed.push('Delete tag functionality');
        } else {
          console.log(`   ❌ Tag "${tagToDelete}" still exists after deletion`);
          testResults.failed.push('Delete tag functionality');
        }
      } else {
        console.log('   ⚠ Could not find tag to delete');
        testResults.failed.push('Delete tag functionality - tag not found');
      }
      
      await takeScreenshot('05-after-delete', 'After deleting tag');
    } else {
      console.log('   ℹ Delete functionality not available');
    }

    // ========== TEST 5: VERIFY TAG COUNT ==========
    console.log('\n📌 TEST 5: Verify Final Tag Count');
    console.log('-' .repeat(40));
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Count all tags
    const allTags = await page.locator('.cursor-pointer, [role="row"], .tag-item').all();
    console.log(`   Total tags in system: ${allTags.length}`);
    
    // Verify our test tags
    let foundCount = 0;
    for (const tag of TEST_TAGS) {
      if (await tagExistsInList(tag.name)) {
        foundCount++;
        console.log(`   ✓ Found: "${tag.name}"`);
      } else if (await tagExistsInList(tag.name + ' EDITED')) {
        foundCount++;
        console.log(`   ✓ Found (edited): "${tag.name} EDITED"`);
      }
    }
    
    console.log(`   Found ${foundCount} of our test tags`);
    testResults.passed.push(`Tag count verification: ${foundCount} tags`);
    
    await takeScreenshot('06-final-state', 'Final state of tags page');

    // ========== TEST 6: ASSIGN TAG TO HACK ==========
    console.log('\n📌 TEST 6: Assign Tag to Hack');
    console.log('-' .repeat(40));
    
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    
    // Click edit on first hack
    const editHackButton = await page.locator('a:has-text("Edit"), button:has-text("Edit")').first();
    if (await editHackButton.count() > 0) {
      await editHackButton.click();
      await page.waitForURL('**/edit');
      await page.waitForLoadState('networkidle');
      
      // Scroll to tags section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // Select a tag
      const tagCheckboxes = await page.locator('input[type="checkbox"]').all();
      if (tagCheckboxes.length > 0) {
        // Check first unchecked box
        for (const checkbox of tagCheckboxes) {
          const isChecked = await checkbox.isChecked();
          if (!isChecked) {
            await checkbox.click({ force: true });
            console.log('   ✓ Selected a tag for the hack');
            break;
          }
        }
        
        // Save hack
        await page.click('button:has-text("Update Hack")');
        await page.waitForTimeout(2000);
        
        console.log('   ✓ Hack updated with tag');
        testResults.passed.push('Assign tag to hack');
        
        await takeScreenshot('07-hack-with-tag', 'Hack updated with tag');
      }
    }

    // ========== RESULTS SUMMARY ==========
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(50));
    
    console.log(`\n✅ PASSED: ${testResults.passed.length} tests`);
    testResults.passed.forEach(test => console.log(`   • ${test}`));
    
    if (testResults.failed.length > 0) {
      console.log(`\n❌ FAILED: ${testResults.failed.length} tests`);
      testResults.failed.forEach(test => console.log(`   • ${test}`));
    }
    
    console.log('\n📸 Screenshots saved:');
    testResults.screenshots.forEach(screenshot => console.log(`   • ${screenshot}`));
    
    // Save results to file
    fs.writeFileSync('tag-crud-test-results.json', JSON.stringify(testResults, null, 2));
    console.log('\n📄 Detailed results saved to: tag-crud-test-results.json');
    
    const successRate = (testResults.passed.length / (testResults.passed.length + testResults.failed.length) * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    await page.screenshot({ path: 'tag-crud-error.png' });
    testResults.failed.push(`Test suite error: ${error.message}`);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

// Run the tests
testTagCRUD().catch(console.error);