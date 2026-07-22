import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response =
        await axiosInstance.get("/Notifications/my");

      setNotifications(
        response.data?.notifications ?? []
      );
    } catch (error) {
      console.error("Notification loading error:", error);

      const errorMessage =
        error.response?.data?.message ??
        "Unable to load notifications.";

      setIsError(true);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.isRead
    ).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "Unread") {
      return notifications.filter(
        (notification) => !notification.isRead
      );
    }

    if (filter === "Read") {
      return notifications.filter(
        (notification) => notification.isRead
      );
    }

    return notifications;
  }, [notifications, filter]);

  const markAsRead = async (notificationId) => {
    setUpdatingId(notificationId);
    setMessage("");
    setIsError(false);

    try {
      await axiosInstance.put(
        `/Notifications/${notificationId}/read`
      );

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.notificationId === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error("Mark notification error:", error);

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to mark the notification as read."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    setMessage("");
    setIsError(false);

    try {
      const response =
        await axiosInstance.put(
          "/Notifications/read-all"
        );

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setMessage(
        response.data?.message ??
          "All notifications marked as read."
      );
    } catch (error) {
      console.error("Mark all notifications error:", error);

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    const confirmed = window.confirm(
      "Delete this notification?"
    );

    if (!confirmed) {
      return;
    }

    setUpdatingId(notificationId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.delete(
        `/Notifications/${notificationId}`
      );

      setNotifications((previousNotifications) =>
        previousNotifications.filter(
          (notification) =>
            notification.notificationId !== notificationId
        )
      );

      setMessage(
        response.data?.message ??
          "Notification deleted successfully."
      );
    } catch (error) {
      console.error("Delete notification error:", error);

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to delete the notification."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    return new Date(dateValue).toLocaleString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNotificationClass = (type) => {
    const normalizedType =
      type?.toLowerCase() ?? "";

    if (
      normalizedType.includes("selected") ||
      normalizedType.includes("shortlisted")
    ) {
      return "success";
    }

    if (
      normalizedType.includes("rejected") ||
      normalizedType.includes("cancelled")
    ) {
      return "danger";
    }

    if (
      normalizedType.includes("interview") ||
      normalizedType.includes("review")
    ) {
      return "info";
    }

    return "general";
  };

  if (loading) {
    return (
      <div className="notifications-state-card">
        <h2>Loading notifications...</h2>
        <p>Please wait while your updates are loaded.</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <section className="notifications-header">
        <div>
          <span className="notifications-label">
            Candidate Updates
          </span>

          <h2>Notifications</h2>

          <p>
            View your application and interview updates.
          </p>
        </div>

        <div className="notification-summary">
          <div>
            <strong>{notifications.length}</strong>
            <span>Total</span>
          </div>

          <div>
            <strong>{unreadCount}</strong>
            <span>Unread</span>
          </div>
        </div>
      </section>

      <section className="notifications-toolbar">
        <div className="notification-filter-group">
          {["All", "Unread", "Read"].map((filterValue) => (
            <button
              type="button"
              key={filterValue}
              className={
                filter === filterValue
                  ? "notification-filter active"
                  : "notification-filter"
              }
              onClick={() => setFilter(filterValue)}
            >
              {filterValue}
            </button>
          ))}
        </div>

        <div className="notification-toolbar-actions">
          <button
            type="button"
            className="notification-refresh-button"
            onClick={loadNotifications}
          >
            Refresh
          </button>

          <button
            type="button"
            className="mark-all-button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || markingAll}
          >
            {markingAll
              ? "Updating..."
              : "Mark All as Read"}
          </button>
        </div>
      </section>

      {message && (
        <div
          className={
            isError
              ? "notifications-message error"
              : "notifications-message success"
          }
        >
          {message}
        </div>
      )}

      {filteredNotifications.length === 0 ? (
        <div className="notifications-state-card">
          <h3>No notifications found</h3>
          <p>
            There are no notifications matching this filter.
          </p>
        </div>
      ) : (
        <section className="notifications-list">
          {filteredNotifications.map((notification) => (
            <article
              key={notification.notificationId}
              className={
                notification.isRead
                  ? "notification-card read"
                  : "notification-card unread"
              }
            >
              <div
                className={`notification-type-indicator ${getNotificationClass(
                  notification.type
                )}`}
              />

              <div className="notification-content">
                <div className="notification-card-header">
                  <div>
                    <div className="notification-title-row">
                      <h3>{notification.title}</h3>

                      {!notification.isRead && (
                        <span className="unread-badge">
                          New
                        </span>
                      )}
                    </div>

                    <span className="notification-type">
                      {notification.type}
                    </span>
                  </div>

                  <span className="notification-date">
                    {formatDateTime(
                      notification.createdAt
                    )}
                  </span>
                </div>

                <p className="notification-message">
                  {notification.message}
                </p>

                {notification.jobApplicationId && (
                  <p className="notification-application-id">
                    Application ID: #
                    {notification.jobApplicationId}
                  </p>
                )}

                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      type="button"
                      className="mark-read-button"
                      disabled={
                        updatingId ===
                        notification.notificationId
                      }
                      onClick={() =>
                        markAsRead(
                          notification.notificationId
                        )
                      }
                    >
                      {updatingId ===
                      notification.notificationId
                        ? "Updating..."
                        : "Mark as Read"}
                    </button>
                  )}

                  <button
                    type="button"
                    className="delete-notification-button"
                    disabled={
                      updatingId ===
                      notification.notificationId
                    }
                    onClick={() =>
                      deleteNotification(
                        notification.notificationId
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default Notifications;