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

module.exports = {
    getOnboardingMessage,
    getOnboardingSuccessMessage
};