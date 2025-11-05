import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import dayjs from 'dayjs';
import { FaExchangeAlt } from 'react-icons/fa';

export function Requests() {
  const queryClient = useQueryClient();

  // Fetch all requests
  const { data = { incoming: [], outgoing: [] }, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const { data } = await api.get('/swaps/requests');
      return data; // { incoming: [], outgoing: [] }
    },
  });

  // Respond to swap mutation
  const respondSwapMutation = useMutation({
    mutationFn: ({ requestId, accepted }) =>
      api.post(`/swaps/swap-response/${requestId}`, { accepted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.invalidateQueries({ queryKey: ['swappableSlots'] });
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to respond to swap');
    },
  });

  // Tag colors for status
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'ACCEPTED':
        return '#10b981';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (isLoading) return <div style={styles.center}>Loading requests...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Swap Requests</h1>

      {/* INCOMING REQUESTS */}
      <h2 style={styles.sectionTitle}>Incoming Requests</h2>
      <div style={styles.section}>
        {data.incoming.length === 0 ? (
          <div style={styles.empty}>No incoming swap requests</div>
        ) : (
          data.incoming.map((req) => {
            const fromName =
              req.sender?.name ||
              req.fromUser?.name ||
              req.requestedBy?.name ||
              'Unknown User';
            return (
              <div key={req.id} style={styles.reqCard}>
                {/* Counterparty header */}
                <div style={styles.counterpartyRow}>
                  <span style={styles.counterpartyLabel}>From:</span>
                  <span style={styles.counterpartyName}>{fromName}</span>
                </div>

                <div style={styles.reqRow}>
                  <div style={styles.slot}>
                    <p style={styles.slotLabel}>You offer</p>
                    <p style={styles.slotTitle}>{req.mySlot?.title}</p>
                    <p style={styles.slotTime}>
                      {dayjs(req.mySlot?.startTime).format('MMM D, h:mm A')} -{' '}
                      {dayjs(req.mySlot?.endTime).format('h:mm A')}
                    </p>
                  </div>

                  <div style={styles.arrow}>
                    <FaExchangeAlt size={20} color="#10b981" />
                  </div>

                  <div style={styles.slot}>
                    <p style={styles.slotLabel}>To get</p>
                    <p style={styles.slotTitle}>{req.theirSlot?.title}</p>
                    <p style={styles.slotTime}>
                      {dayjs(req.theirSlot?.startTime).format('MMM D, h:mm A')} -{' '}
                      {dayjs(req.theirSlot?.endTime).format('h:mm A')}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(req.status),
                    }}
                  >
                    {req.status}
                  </span>
                </div>

                {req.status === 'PENDING' && (
                  <div style={styles.actionRow}>
                    <button
                      style={{ ...styles.actionBtn, backgroundColor: '#10b981' }}
                      onClick={() =>
                        respondSwapMutation.mutate({ requestId: req.id, accepted: true })
                      }
                    >
                      Accept
                    </button>
                    <button
                      style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }}
                      onClick={() =>
                        respondSwapMutation.mutate({ requestId: req.id, accepted: false })
                      }
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* OUTGOING REQUESTS */}
      <h2 style={styles.sectionTitle}>Outgoing Requests</h2>
      <div style={styles.section}>
        {data.outgoing.length === 0 ? (
          <div style={styles.empty}>No outgoing swap requests</div>
        ) : (
          data.outgoing.map((req) => {
            const toName =
              req.recipient?.name ||
              req.toUser?.name ||
              req.requestedTo?.name ||
              'Unknown User';
            return (
              <div key={req.id} style={styles.reqCard}>
                {/* Counterparty header */}
                <div style={styles.counterpartyRow}>
                  <span style={styles.counterpartyLabel}>To:</span>
                  <span style={styles.counterpartyName}>{toName}</span>
                </div>

                <div style={styles.reqRow}>
                  <div style={styles.slot}>
                    <p style={styles.slotLabel}>You offer</p>
                    <p style={styles.slotTitle}>{req.mySlot?.title}</p>
                    <p style={styles.slotTime}>
                      {dayjs(req.mySlot?.startTime).format('MMM D, h:mm A')} -{' '}
                      {dayjs(req.mySlot?.endTime).format('h:mm A')}
                    </p>
                  </div>

                  <div style={styles.arrow}>
                    <FaExchangeAlt size={20} color="#10b981" />
                  </div>

                  <div style={styles.slot}>
                    <p style={styles.slotLabel}>To get</p>
                    <p style={styles.slotTitle}>{req.theirSlot?.title}</p>
                    <p style={styles.slotTime}>
                      {dayjs(req.theirSlot?.startTime).format('MMM D, h:mm A')} -{' '}
                      {dayjs(req.theirSlot?.endTime).format('h:mm A')}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(req.status),
                    }}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '950px',
    margin: '0 auto',
    padding: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginTop: '2rem',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  section: {
    background: '#fff',
    borderRadius: '12px',
    marginBottom: '2rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    padding: '1.5rem',
  },
  reqCard: {
    borderRadius: '8px',
    marginBottom: '1.5rem',
    background: '#f7f9fa',
    padding: '1rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  counterpartyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    padding: '0 0.25rem',
  },
  counterpartyLabel: {
    color: '#6b7280',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  counterpartyName: {
    color: '#1f2937',
    fontWeight: 700,
    fontSize: '1rem',
  },
  reqRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '0.5rem',
  },
  slot: {
    background: '#fafcff',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    padding: '0.75rem 1.25rem',
    flex: 1,
    minWidth: '0',
  },
  slotLabel: {
    fontWeight: '600',
    color: '#6b7280',
    fontSize: '0.93rem',
    margin: 0,
    marginBottom: '0.3rem',
  },
  slotTitle: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: '#1f2937',
    margin: 0,
    marginBottom: '0.15rem',
  },
  slotTime: {
    fontSize: '0.95rem',
    color: '#6b7280',
    margin: 0,
  },
  arrow: {
    minWidth: '28px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    padding: '0.3rem 0.75rem',
    borderRadius: '12px',
    fontWeight: '600',
    color: '#fff',
    fontSize: '0.95rem',
    marginLeft: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    alignSelf: 'flex-start',
  },
  actionRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.7rem',
    alignItems: 'center',
  },
  actionBtn: {
    padding: '0.55rem 1.1rem',
    borderRadius: '6px',
    fontWeight: '600',
    color: '#fff',
    fontSize: '0.97rem',
    border: 'none',
    cursor: 'pointer',
    minWidth: '96px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    padding: '2rem 0',
    fontSize: '1.05rem',
  },
  center: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
    fontSize: '1.15rem',
  },
};
