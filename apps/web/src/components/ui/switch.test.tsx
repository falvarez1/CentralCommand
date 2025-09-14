import React, { useState } from 'react'
import { Switch } from './switch'

// Test component to verify Switch functionality
export const SwitchTest = () => {
  const [checked, setChecked] = useState(false)

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Switch Component Test</h3>

      {/* Basic Switch */}
      <div className="flex items-center space-x-2">
        <Switch
          id="test-switch"
          checked={checked}
          onCheckedChange={setChecked}
        />
        <label htmlFor="test-switch" className="text-sm">
          Toggle me (currently: {checked ? 'ON' : 'OFF'})
        </label>
      </div>

      {/* Disabled Switch */}
      <div className="flex items-center space-x-2">
        <Switch
          id="disabled-switch"
          disabled
        />
        <label htmlFor="disabled-switch" className="text-sm text-gray-500">
          Disabled switch
        </label>
      </div>

      {/* Pre-checked Switch */}
      <div className="flex items-center space-x-2">
        <Switch
          id="checked-switch"
          defaultChecked
        />
        <label htmlFor="checked-switch" className="text-sm">
          Pre-checked switch
        </label>
      </div>
    </div>
  )
}

// Usage example in comments:
/*
// In your component:
import { Switch } from '@/components/ui/switch'

function SettingsForm() {
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="flex items-center justify-between">
      <label htmlFor="notifications">Enable notifications</label>
      <Switch
        id="notifications"
        checked={notifications}
        onCheckedChange={setNotifications}
      />
    </div>
  )
}
*/