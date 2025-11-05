import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import dayjs from 'dayjs';

export function Marketplace() {
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedMySlot, setSelectedMySlot] = useState('');
  const [error, setError] = useState('');

  // Fetch swappable slots from others
  const { data: swappableSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['swappableSlots'],
    queryFn: async () => {
      const { data } = await api.get('/swaps/swappable-slots');
      return data;
    },
  });

  // Fetch user's swappable events
  const { data: myEvents = [], isLoading: myEventsLoading } = useQuery({
    queryKey: ['myEvents'],
    queryFn: async () => {
      const { data } = await api.get('/events');
      return data.filter((e) => e.status === 'SWAPPABLE');
    },
  });

  // Request swap mutation
  const requestSwapMutation = useMutation({
    mutationFn: ({ mySlotId, theirSlotId }) =>
      api.post('/swaps/swap-request', { mySlotId, theirSlotId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swappableSlots'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setShowSwapModal(false);
      setSelectedSlot(null);
      setSelectedMySlot('');
      alert('Swap request sent!');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to request swap');
    },
  });

  const handleRequestSwap = () => {
    if (!selectedMySlot) {
      setError('Please select one of your swappable slots');
      return;
    }
    requestSwapMutation.mutate({
      mySlotId: selectedMySlot,
      theirSlotId: selectedSlot.id,
    });
  };

  if (slotsLoading) return <div style={styles.center}>Loading marketplace...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Marketplace - Available Slots</h1>

      {swappableSlots.length === 0 ? (
        <div style={styles.empty}>
          <p>No swappable slots available right now.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {swappableSlots.map((slot) => (
            <div key={slot.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3>{slot.title}</h3>
                <span style={styles.owner}>by {slot.owner?.name}</span>
              </div>

              <div style={styles.cardBody}>
                <p>
                  <strong>Start:</strong> {dayjs(slot.startTime).format('MMM D, h:mm A')}
                </p>
                <p>
                  <strong>End:</strong> {dayjs(slot.endTime).format('h:mm A')}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedSlot(slot);
                  setShowSwapModal(true);
                  setError('');
                  setSelectedMySlot('');
                }}
                style={styles.requestBtn}
              >
                Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Request Swap Modal */}
      {showSwapModal && selectedSlot && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Request Swap</h2>
            <p style={styles.modalSubtitle}>
              You want: <strong>{selectedSlot.title}</strong>
            </p>
            <p style={styles.modalSubtitle}>
              From: <strong>{selectedSlot.owner?.name}</strong>
            </p>

            {error && <div style={styles.error}>{error}</div>}

            <p style={styles.label}>Select one of your swappable slots:</p>

            {myEventsLoading ? (
              <p>Loading your events...</p>
            ) : myEvents.length === 0 ? (
              <p style={styles.warning}>
                You don't have any swappable slots. Create one first!
              </p>
            ) : (
              <div style={styles.slotList}>
                {myEvents.map((event) => (
                  <label key={event.id} style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="mySlot"
                      value={event.id}
                      checked={selectedMySlot === event.id}
                      onChange={(e) => setSelectedMySlot(e.target.value)}
                      style={styles.radio}
                    />
                    <span>
                      {event.title} ({dayjs(event.startTime).format('MMM D, h:mm A')})
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowSwapModal(false);
                  setSelectedSlot(null);
                }}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestSwap}
                disabled={requestSwapMutation.isPending || !selectedMySlot}
                style={styles.submitBtn}
              >
                {requestSwapMutation.isPending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  title: {
    marginBottom: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    marginBottom: '1rem',
  },
  owner: {
    display: 'block',
    color: '#6b7280',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  },
  cardBody: {
    flex: 1,
    marginBottom: '1rem',
  },
  requestBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#6b7280',
  },
  center: {
    textAlign: 'center',
    padding: '2rem',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '500px',
  },
  modalSubtitle: {
    marginBottom: '0.5rem',
    color: '#374151',
  },
  label: {
    display: 'block',
    fontWeight: '500',
    marginBottom: '1rem',
    marginTop: '1rem',
  },
  slotList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  radio: {
    marginRight: '0.75rem',
  },
  warning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  cancelBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#e5e7eb',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
