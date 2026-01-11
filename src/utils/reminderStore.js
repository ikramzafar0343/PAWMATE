const REMINDER_SETTINGS_KEY = 'pawmate_reminder_settings';

const DEFAULT_SETTINGS = {
  enabled: true,
  remind7DaysBefore: true,
  remindOnDueDate: false,
  emailEnabled: true,
  pushEnabled: true
};

export const getReminderSettings = () => {
  const stored = localStorage.getItem(REMINDER_SETTINGS_KEY);
  if (!stored) {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
};

export const updateReminderSettings = (settings) => {
  const current = getReminderSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('reminderSettingsUpdate'));
  return updated;
};
