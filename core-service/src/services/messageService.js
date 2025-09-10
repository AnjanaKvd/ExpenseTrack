/**
 * A service to handle sending messages back to the user.
 * In this phase, it will just log the messages to the console.
 */

const getOnboardingMessage = (phoneNumber) => {
    const welcomeText = `
👋 Welcome to TrustLedger!

I'm your personal bot to help you track your daily and shared expenses.

Here's how it works:
1️⃣ Add items you want to track (e.g., "add item: Coffee").
2️⃣ Log expenses using simple messages (e.g., "spent 150 on lunch").
3️⃣ Share expenses with friends (e.g., "shared a 300 taxi with Kamal").

By continuing, you accept our Terms & Conditions. Let's get started!
💥 Send yes to begin!
  `;

    console.log(`✉️  SENDING ONBOARDING MESSAGE to ${phoneNumber}:`);
    return welcomeText;
    // Make an API call to the gateway here.

};

const getOnboardingSuccessMessage = () => {
    const successText = `
✅ Great! Your account is now active.

You can start by adding an item to track, like this:
*add item: Groceries*

Or log your first expense:
*spent 500 on Groceries*
  `;
    console.log('✅ Generated onboarding success message.');
    return successText;
};

/**
 * Formats a list of items into a user-friendly string.
 * @param {Array<object>} items An array of item objects, each with an 'item_name' property.
 * @returns {string} A formatted string for the user.
 */
const formatItemsList = (items) => {
  if (!items || items.length === 0) {
    return "You haven't added any items to track yet. Try starting with:\n*add item*";
  }

  const itemNames = items.map((item, index) => `${index + 1}. ${item.item_name}`);
  return "Here are your current trackable items:\n\n" + itemNames.join('\n');
};

module.exports = {
  getOnboardingMessage,
  getOnboardingSuccessMessage,
  formatItemsList,
};