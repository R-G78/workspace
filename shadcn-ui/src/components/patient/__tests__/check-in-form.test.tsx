import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInForm } from '@/components/patient/check-in-form';

// Create a mock for the Select component
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, name, onValueChange }) => {
    return (
      <select 
        data-testid={`mock-select-${name}`}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    );
  },
  SelectTrigger: ({ children }) => children,
  SelectValue: ({ children }) => children,
  SelectContent: ({ children }) => children,
  SelectItem: ({ value, children }) => (
    <option value={value}>{children}</option>
  ),
}));

// Mock sonner toast functions
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Import the mock
import { toast } from 'sonner';

// Mock fetch
const mockFetch = jest.fn() as jest.Mock;
global.fetch = mockFetch as unknown as typeof global.fetch;

// Helper function to mock fetch responses
const mockFetchResponse = (data: any, ok = true) => {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data)
  } as Response);
};

describe('CheckInForm', () => {
  const mockOnCheckInComplete = jest.fn();

  const mockPatient = {
    name: "John Doe",
    age: 30,
    gender: "Male",
    contactNumber: "1234567890",
    reason: "Regular checkup",
    symptoms: ["Fever", "Cough"],
    urgencyLevel: "medium",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockOnCheckInComplete.mockClear();

    // Default successful responses for both fetch calls
    mockFetch
      .mockImplementationOnce(() => mockFetchResponse({ id: 'queue-123', position: 5 }))
      .mockImplementationOnce(() => mockFetchResponse({ success: true }));
  });

  test('submits patient check-in form successfully', async () => {
    render(<CheckInForm onCheckInComplete={mockOnCheckInComplete} />);

    // Fill in required fields
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /full name/i }), mockPatient.name);
    await user.type(screen.getByRole('spinbutton', { name: /age/i }), mockPatient.age.toString());
    
    // Handle gender selection using data-testid
    const genderSelect = screen.getByTestId('mock-select-undefined') as HTMLSelectElement;
    genderSelect.value = mockPatient.gender;
    fireEvent.change(genderSelect, { target: { value: mockPatient.gender } });

    await user.type(screen.getByRole('textbox', { name: /contact number/i }), mockPatient.contactNumber);
    await user.type(screen.getByRole('textbox', { name: /chief complaint/i }), mockPatient.reason);
    await user.type(screen.getByRole('textbox', { name: /description/i }), mockPatient.symptoms.join(', '));
    await user.click(screen.getByRole('checkbox', { name: /consent to treatment/i }));

    // Submit form and log debug info
    console.log('Before click: toast mock calls:', (toast.success as jest.Mock).mock.calls);
    await user.click(screen.getByRole('button', { name: /complete check-in/i }));
    console.log('After click: toast mock calls:', (toast.success as jest.Mock).mock.calls);
    console.log('Mock fetch calls:', mockFetch.mock.calls);

    // Wait for API calls and component updates
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockOnCheckInComplete).toHaveBeenCalledTimes(1);
      expect(mockOnCheckInComplete).toHaveBeenCalledWith({
        id: 'queue-123',
        position: 5,
        triage: {
          success: true
        }
      });
    });

    // Verify success toast was shown
    await waitFor(() => {
      expect((toast.success as jest.Mock)).toHaveBeenCalledWith("Check-in complete", expect.objectContaining({
        description: expect.any(String)
      }));
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock failed API response for patient endpoint
  // Reset any queued implementations (default ones are set in beforeEach)
  mockFetch.mockReset();
  // Provide a single failing fetch for this test
  mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    render(<CheckInForm onCheckInComplete={mockOnCheckInComplete} />);

    // Set up userEvent instance
    const user = userEvent.setup();

    // Fill in required fields
    await user.type(screen.getByRole('textbox', { name: /full name/i }), mockPatient.name);
    await user.type(screen.getByRole('spinbutton', { name: /age/i }), mockPatient.age.toString());
    const genderSelect = screen.getByTestId('mock-select-undefined') as HTMLSelectElement;
    genderSelect.value = mockPatient.gender;
    fireEvent.change(genderSelect, { target: { value: mockPatient.gender } });
    await user.type(screen.getByRole('textbox', { name: /contact number/i }), mockPatient.contactNumber);
    await user.type(screen.getByRole('textbox', { name: /chief complaint/i }), mockPatient.reason);
    await user.type(screen.getByRole('textbox', { name: /description/i }), mockPatient.symptoms.join(', '));
    await user.click(screen.getByRole('checkbox', { name: /consent to treatment/i }));

    // Submit form
    await user.click(screen.getByRole('button', { name: /complete check-in/i }));

    // Verify error toast was shown
    await waitFor(() => {
      expect((toast.error as jest.Mock)).toHaveBeenCalledWith("Check-in failed", expect.objectContaining({
        description: expect.any(String)
      }));
    });

    expect(mockOnCheckInComplete).not.toHaveBeenCalled();
  });
});
