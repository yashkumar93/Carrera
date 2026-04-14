"""
Background Scheduler — APScheduler jobs for Careerra.

Jobs:
  1. auto_archive_sessions   — daily at 02:00 UTC
     Archives sessions inactive for 90+ days (status: active → archived).

  2. re_engagement_check     — daily at 09:00 UTC
     Logs users who have not started a session in 7+ days.
     Extend with an email provider (SendGrid / SES) by filling in
     _send_re_engagement_email() below.
"""
import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


# ---------------------------------------------------------------------------
# Job implementations
# ---------------------------------------------------------------------------

def auto_archive_sessions() -> None:
    """Archive sessions that have had no messages for 90+ days."""
    try:
        from app.services.firestore_service import get_firestore_client
        db = get_firestore_client()

        cutoff = datetime.utcnow() - timedelta(days=90)
        sessions_ref = db.collection("sessions")

        # Query for active sessions last updated before the cutoff
        query = (
            sessions_ref
            .where("status", "==", "active")
            .where("updatedAt", "<", cutoff)
        )
        docs = query.stream()

        archived = 0
        for doc in docs:
            doc.reference.update({"status": "archived", "archivedAt": datetime.utcnow()})
            archived += 1

        if archived:
            logger.info("Auto-archive: archived %d inactive session(s)", archived)
        else:
            logger.debug("Auto-archive: no sessions to archive")

    except Exception as exc:
        logger.error("auto_archive_sessions failed: %s", exc)


def re_engagement_check() -> None:
    """
    Identify users inactive for 7+ days and send re-engagement nudge.
    Currently logs; wire up _send_re_engagement_email() for live emails.
    """
    try:
        from app.services.firestore_service import get_firestore_client
        db = get_firestore_client()

        cutoff = datetime.utcnow() - timedelta(days=7)
        users_ref = db.collection("users")

        # Users whose lastActive timestamp is older than 7 days
        query = users_ref.where("lastActive", "<", cutoff)
        docs = query.stream()

        nudged = 0
        for doc in docs:
            data = doc.to_dict() or {}
            email = data.get("email")
            name = data.get("name", "there")
            if email:
                _send_re_engagement_email(email, name)
                nudged += 1

        if nudged:
            logger.info("Re-engagement: nudged %d user(s)", nudged)
        else:
            logger.debug("Re-engagement: no inactive users found")

    except Exception as exc:
        logger.error("re_engagement_check failed: %s", exc)


def _send_re_engagement_email(email: str, name: str) -> None:
    """
    Send a re-engagement email.

    Currently a stub — replace the body with real SMTP / SendGrid / SES calls.
    Example with SendGrid:
        import sendgrid, os
        from sendgrid.helpers.mail import Mail
        sg = sendgrid.SendGridAPIClient(api_key=os.environ["SENDGRID_API_KEY"])
        message = Mail(
            from_email="hello@careerra.ai",
            to_emails=email,
            subject="Your career journey awaits",
            html_content=f"<p>Hi {name}, it's been a while! ...</p>",
        )
        sg.send(message)
    """
    logger.info(
        "Re-engagement email stub — would send to %s (%s)", email, name
    )


# ---------------------------------------------------------------------------
# Scheduler lifecycle
# ---------------------------------------------------------------------------

def start() -> None:
    """Start the background scheduler (idempotent)."""
    global _scheduler
    if _scheduler and _scheduler.running:
        return

    _scheduler = BackgroundScheduler(timezone="UTC")

    # Auto-archive — every day at 02:00 UTC
    _scheduler.add_job(
        auto_archive_sessions,
        trigger=CronTrigger(hour=2, minute=0),
        id="auto_archive",
        name="Auto-archive inactive sessions",
        replace_existing=True,
    )

    # Re-engagement check — every day at 09:00 UTC
    _scheduler.add_job(
        re_engagement_check,
        trigger=CronTrigger(hour=9, minute=0),
        id="re_engagement",
        name="Re-engagement email check",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info(
        "Scheduler started with jobs: %s",
        [job.name for job in _scheduler.get_jobs()],
    )


def stop() -> None:
    """Gracefully shut down the scheduler."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")
