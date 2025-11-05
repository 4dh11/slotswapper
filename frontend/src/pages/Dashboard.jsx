import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import dayjs from 'dayjs';
import { FaLock, FaHourglass, FaExchangeAlt, FaTimes } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

export function Dashboard() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, placement: 'bottom' });
  const [pendingDelete, setPendingDelete] = useState(new Set());
  const [deletionBackup, setDeletionBackup] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    status: 'BUSY',
  });
  const [error, setError] = useState('');

  // Fetch user's events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['myEvents'],
    queryFn: async () => {
      const { data } = await api.get('/events');
      return data;
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (newEvent) => api.post('/events', newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      setFormData({ title: '', startTime: '', endTime: '', status: 'BUSY' });
      setShowCreateModal(false);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to create event');
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/events/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to update event');
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id) => api.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      setPendingDelete(new Set());
      setDeletionBackup({});
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to delete event');
    },
  });

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return events.filter((event) => dayjs(event.startTime).format('YYYY-MM-DD') === dateStr);
  };

  // Generate calendar days
  const firstDay = currentDate.startOf('month').day();
  const daysInMonth = currentDate.daysInMonth();
  const daysArray = [];

  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(currentDate.date(i));
  }

  // Calculate smart tooltip position
  const calculateTooltipPosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 340;
    const tooltipHeight = 250;
    const margin = 15;

    const spaces = {
      right: window.innerWidth - (rect.right + margin),
      left: rect.left - tooltipWidth - margin,
      top: rect.top - tooltipHeight - margin,
      bottom: window.innerHeight - (rect.bottom + margin),
    };

    const placements = [
      { name: 'right', space: spaces.right },
      { name: 'left', space: spaces.left },
      { name: 'top', space: spaces.top },
      { name: 'bottom', space: spaces.bottom },
    ].sort((a, b) => b.space - a.space);

    let placement = 'bottom';
    let x = 0;
    let y = 0;

    for (const p of placements) {
      if (p.space > 0 || placements[0].space === p.space) {
        placement = p.name;
        break;
      }
    }

    switch (placement) {
      case 'right':
        x = rect.right + margin;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'left':
        x = rect.left - tooltipWidth - margin;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - margin;
        break;
      case 'bottom':
      default:
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + margin;
        break;
    }

    const minX = margin;
    const maxX = window.innerWidth - tooltipWidth - margin;
    x = Math.max(minX, Math.min(x, maxX));

    const minY = margin - tooltipHeight;
    const maxY = window.innerHeight + margin;
    y = Math.max(minY, Math.min(y, maxY));

    return { x, y, placement };
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.title || !formData.startTime || !formData.endTime) {
      setError('Please fill all fields');
      return;
    }
    createEventMutation.mutate({
      title: formData.title,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      status: formData.status,
    });
  };

  const toggleSwappable = (event) => {
    const newStatus = event.status === 'BUSY' ? 'SWAPPABLE' : 'BUSY';

    if (selectedDayEvents) {
      const updatedEvents = selectedDayEvents.events.map((e) =>
        e.id === event.id ? { ...e, status: newStatus } : e
      );
      setSelectedDayEvents({
        ...selectedDayEvents,
        events: updatedEvents,
      });
    }

    updateEventMutation.mutate({ id: event.id, status: newStatus });
  };

  const handleDeleteEvent = (eventId, event) => {
    setPendingDelete(new Set([...pendingDelete, eventId]));
    setDeletionBackup({ ...deletionBackup, [eventId]: event });
  };

  const handleUndoDelete = (eventId) => {
    const newPendingDelete = new Set(pendingDelete);
    newPendingDelete.delete(eventId);
    setPendingDelete(newPendingDelete);

    const newBackup = { ...deletionBackup };
    delete newBackup[eventId];
    setDeletionBackup(newBackup);
  };

  const handleCloseModal = () => {
    if (pendingDelete.size > 0) {
      pendingDelete.forEach((eventId) => {
        deleteEventMutation.mutate(eventId);
      });
    }

    setShowDayModal(false);
    setSelectedDayEvents(null);
    setPendingDelete(new Set());
    setDeletionBackup({});
  };

  // ICONS for statuses:
  // BUSY: <FaLock />
  // SWAPPABLE: <FaExchangeAlt />
  // SWAP_PENDING: <FaHourglass />
  // Delete button: <FaTimes />

  const getStatusColor = (status) => {
    switch (status) {
      case 'BUSY':
        return {
          icon: <FaLock size={20} />,
          actionIcon: <FaExchangeAlt size={18} />,
          color: '#dc2626',
          bg: '#fee2e2',
        };
      case 'SWAPPABLE':
        return {
          icon: <FaExchangeAlt size={20} />,
          actionIcon: <FaLock size={18} />,
          color: '#10b981',
          bg: '#dcfce7',
        };
      case 'SWAP_PENDING':
        return {
          icon: <FaHourglass size={20} />,
          actionIcon: <FaHourglass size={18} />,
          color: '#f59e0b',
          bg: '#fef3c7',
        };
      default:
        return {
          icon: <FaLock size={20} />,
          actionIcon: <FaExchangeAlt size={18} />,
          color: '#6b7280',
          bg: '#f3f4f6',
        };
    }
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dayEvents = getEventsForDate(day);
    if (dayEvents.length > 0) {
      setSelectedDayEvents({ date: day, events: dayEvents });
      setShowDayModal(true);
    }
  };

  const handleDayHover = (day, e) => {
    if (!day) return;
    const dayEvents = getEventsForDate(day);
    if (dayEvents.length > 0) {
      setHoveredDay(day.format('YYYY-MM-DD'));
      const pos = calculateTooltipPosition(e);
      setTooltipPos(pos);
    }
  };

  const handleDayLeave = () => {
    setHoveredDay(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setError('');
    setFormData({
      title: '',
      startTime: '',
      endTime: '',
      status: 'BUSY',
    });
  };

  if (isLoading) return <div style={styles.center}>Loading your calendar...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Calendar</h1>
          <p style={styles.subtitle}>
            {currentDate.format('MMMM YYYY')} • {events.length} total events
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
          + Create Event
        </button>
      </div>

      {/* Month Navigation */}
      <div style={styles.monthNav}>
        <button
          onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))}
          style={styles.navBtn}
        >
          ← Previous
        </button>
        <span style={styles.monthTitle}>{currentDate.format('MMMM YYYY')}</span>
        <button
          onClick={() => setCurrentDate(currentDate.add(1, 'month'))}
          style={styles.navBtn}
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={styles.calendarContainer}>
        {/* Days of week header */}
        <div style={styles.weekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} style={styles.weekDay}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div style={styles.daysGrid}>
          {daysArray.map((day, index) => {
            const dayEvents = day ? getEventsForDate(day) : [];
            const isCurrentDay = day && day.isSame(dayjs(), 'day');

            return (
              <div
                key={index}
                style={{
                  ...styles.dayCell,
                  ...(day ? styles.dayActive : styles.dayInactive),
                  ...(isCurrentDay ? styles.dayToday : {}),
                }}
                onClick={() => handleDayClick(day)}
                onMouseEnter={(e) => handleDayHover(day, e)}
                onMouseLeave={handleDayLeave}
              >
                {day && (
                  <>
                    <div style={styles.dayNumber}>{day.date()}</div>
                    {dayEvents.length > 0 && (
                      <div style={styles.eventContainer}>
                        {dayEvents.slice(0, 2).map((event) => {
                          const color = getStatusColor(event.status);
                          return (
                            <div
                              key={event.id}
                              style={{
                                ...styles.eventPreview,
                                backgroundColor: color.bg,
                              }}
                            >
                              <div style={{ color: color.color, display: 'flex', justifyContent: 'center' }}>
                                {color.icon}
                              </div>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div style={styles.moreCountBadge}>
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredDay && (
        <div
          style={{
            ...styles.tooltip,
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div
            style={{
              ...styles.tooltipArrow,
              ...getArrowStyle(tooltipPos.placement),
            }}
          />

          <div style={styles.tooltipHeader}>
            {dayjs(hoveredDay).format('MMM D')} ({dayjs(hoveredDay).format('dddd')}) - {getEventsForDate(dayjs(hoveredDay)).length} events
          </div>
          <div style={styles.tooltipEvents}>
            {getEventsForDate(dayjs(hoveredDay)).slice(0, 2).map((event) => {
              const color = getStatusColor(event.status);
              return (
                <div key={event.id} style={styles.tooltipEvent}>
                  <div style={{ ...styles.tooltipDot, color: color.color }}>
                    {color.icon}
                  </div>
                  <div style={styles.tooltipEventInfo}>
                    <p style={styles.tooltipEventTitle}>{event.title}</p>
                    <p style={styles.tooltipEventTime}>
                      {dayjs(event.startTime).format('h:mm A')} -{' '}
                      {dayjs(event.endTime).format('h:mm A')}
                    </p>
                  </div>
                </div>
              );
            })}
            {getEventsForDate(dayjs(hoveredDay)).length > 2 && (
              <div style={styles.tooltipMore}>
                +{getEventsForDate(dayjs(hoveredDay)).length - 2} more - Click to see all
              </div>
            )}
          </div>
        </div>
      )}

      {/* Day Modal */}
      {showDayModal && selectedDayEvents && (
        <div style={styles.modal} onClick={handleBackdropClick}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>
                {selectedDayEvents.date.format('dddd')}, {selectedDayEvents.date.format('MMMM D, YYYY')}
              </h2>
              <button onClick={handleCloseModal} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.dayEventsList}>
              {selectedDayEvents.events.length === 0 ? (
                <p style={styles.noEvents}>No events on this day</p>
              ) : (
                selectedDayEvents.events.map((event) => {
                  const color = getStatusColor(event.status);
                  const isMarkedForDelete = pendingDelete.has(event.id);

                  return (
                    <div
                      key={event.id}
                      style={{
                        ...styles.eventCard,
                        ...(isMarkedForDelete ? styles.eventCardDeleted : {}),
                      }}
                    >
                      <div style={styles.eventCardLeft}>
                        <div style={{
                          fontSize: '1.75rem',
                          color: color.color,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '100%'
                        }}>
                          {color.icon}
                        </div>
                      </div>

                      <div style={styles.eventCardCenter}>
                        <h3 style={styles.eventCardTitle}>{event.title}</h3>
                        <p style={styles.eventCardTime}>
                          {dayjs(event.startTime).format('h:mm A')} -{' '}
                          {dayjs(event.endTime).format('h:mm A')}
                        </p>
                        <span
                          style={{
                            ...styles.eventCardStatus,
                            color: color.color,
                          }}
                        >
                          {event.status}
                        </span>
                      </div>

                      <div style={styles.eventCardActions}>
                        {isMarkedForDelete ? (
                          <button
                            onClick={() => handleUndoDelete(event.id)}
                            style={styles.undoBtn}
                          >
                            ↺
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleSwappable(event)}
                              style={{
                                ...styles.actionBtn,
                                backgroundColor:
                                  event.status === 'BUSY' ? '#10b981' : '#6b7280',
                                opacity: event.status === 'SWAP_PENDING' ? 0.5 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              disabled={event.status === 'SWAP_PENDING'}
                              title={
                                event.status === 'SWAP_PENDING'
                                  ? 'Cannot modify while swap is pending'
                                  : event.status === 'BUSY'
                                  ? 'Make Swappable'
                                  : 'Mark Busy'
                              }
                            >
                              {getStatusColor(event.status).actionIcon}
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id, event)}
                              style={styles.deleteBtn}
                              title="Delete"
                            >
                              <FaTimes size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div style={styles.modal} onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeCreateModal();
          }
        }}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Create New Event</h2>
              <button onClick={closeCreateModal} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleCreateEvent} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., Team Meeting, Lunch"
                />
              </div>

              <div style={styles.twoColumn}>
                <div style={styles.field}>
                  <label style={styles.label}>Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={styles.input}
                >
                  <option value="BUSY">Busy (Not available to swap)</option>
                  <option value="SWAPPABLE">Swappable (Open for swap)</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  style={styles.submitBtn}
                >
                  {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Arrow style helper
const getArrowStyle = (placement) => {
  const arrowBase = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  };

  switch (placement) {
    case 'right':
      return {
        ...arrowBase,
        left: '-10px',
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '10px 10px 10px 0',
        borderColor: 'transparent white transparent transparent',
        boxShadow: '-2px 2px 2px rgba(0,0,0,0.05)',
      };
    case 'left':
      return {
        ...arrowBase,
        right: '-10px',
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '10px 0 10px 10px',
        borderColor: 'transparent transparent transparent white',
        boxShadow: '2px 2px 2px rgba(0,0,0,0.05)',
      };
    case 'top':
      return {
        ...arrowBase,
        bottom: '-10px',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '10px 10px 0 10px',
        borderColor: 'white transparent transparent transparent',
        boxShadow: '0px 2px 2px rgba(0,0,0,0.05)',
      };
    case 'bottom':
    default:
      return {
        ...arrowBase,
        top: '-10px',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '0 10px 10px 10px',
        borderColor: 'transparent transparent white transparent',
        boxShadow: '0px -2px 2px rgba(0,0,0,0.05)',
      };
  }
};

// Styles
const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '0.25rem',
    margin: 0,
  },
  createBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
  },
  monthNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  navBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  monthTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  weekHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    backgroundColor: '#f3f4f6',
    borderBottom: '2px solid #e5e7eb',
  },
  weekDay: {
    padding: '1rem',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
  },
  dayCell: {
    minHeight: '100px',
    padding: '0.75rem',
    borderRight: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative',
  },
  dayActive: {
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  dayInactive: {
    backgroundColor: '#f9fafb',
    cursor: 'default',
  },
  dayToday: {
    backgroundColor: '#eff6ff',
    borderLeft: '3px solid #2563eb',
  },
  dayNumber: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  eventContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  eventPreview: {
    padding: '0.3rem 0.5rem',
    borderRadius: '3px',
    fontWeight: '400',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '24px',
  },
  moreCountBadge: {
    backgroundColor: '#e5e7eb',
    color: '#4b5563',
    padding: '0.3rem 0.5rem',
    borderRadius: '3px',
    fontSize: '0.7rem',
    fontWeight: '600',
    textAlign: 'center',
    cursor: 'pointer',
  },
  tooltip: {
    position: 'fixed',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    zIndex: 999,
    minWidth: '320px',
    maxWidth: '340px',
  },
  tooltipArrow: {
    position: 'absolute',
  },
  tooltipHeader: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f3f4f6',
    fontWeight: '600',
    color: '#1f2937',
    borderBottom: '1px solid #e5e7eb',
    borderRadius: '8px 8px 0 0',
    fontSize: '0.95rem',
  },
  tooltipEvents: {
    padding: '0.75rem 0',
  },
  tooltipEvent: {
    display: 'flex',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    alignItems: 'flex-start',
    borderBottom: '1px solid #e5e7eb',
  },
  tooltipDot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    flexShrink: 0,
    width: '36px',        // Fixed width
    height: '36px',       // Fixed height for perfect centering
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tooltipEventInfo: {
    flex: 1,
  },
  tooltipEventTitle: {
    margin: 0,
    fontWeight: '600',
    fontSize: '0.95rem',
    color: '#1f2937',
  },
  tooltipEventTime: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  tooltipMore: {
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    color: '#2563eb',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: '0 0 8px 8px',
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
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6b7280',
  },
  dayEventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  noEvents: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '2rem',
  },
  eventCard: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    borderLeft: '3px solid #2563eb',
    alignItems: 'flex-start',
  },
  eventCardDeleted: {
    backgroundColor: '#fef2f2',
    opacity: 0.7,
    borderLeft: '3px solid #ef4444',
  },
  eventCardLeft: {
  width: '48px',
  height: '70px',          // Ensures vertical centering
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  },

  eventCardCenter: {
    flex: 1,
  },
  eventCardTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
  },
  eventCardTime: {
    margin: '0.25rem 0',
    fontSize: '0.95rem',
    color: '#6b7280',
  },
  eventCardStatus: {
    display: 'inline-block',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginTop: '0.25rem',
  },
  eventCardActions: {
    display: 'flex',
    gap: '0.5rem',
    minWidth: '90px',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionBtn: {
    flex: '1 1 0',
    padding: '0.5rem 0.75rem',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    minWidth: '44px',
    maxWidth: '44px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteBtn: {
    flex: '1 1 0',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    minWidth: '44px',
    maxWidth: '44px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  undoBtn: {
    flex: '1 1 0',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#fef08a',
    color: '#92400e',
    border: '1px solid #fcd34d',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    minWidth: '44px',
    maxWidth: '44px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.95rem',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.95rem',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  cancelBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  center: {
    textAlign: 'center',
    padding: '3rem 2rem',
    color: '#6b7280',
  },
};
