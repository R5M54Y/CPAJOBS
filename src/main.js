/* src/main.js - Entry point for CPA JOBS MVP
   Phase 2: Offer Engine - Add categories, offer CRUD, status management
   All handlers expect D1 and KV bindings injected by Cloudflare
*/

import { importOnJobFeed } from './importers/onjob.js';

// Static file contents embedded as base64 for Cloudflare Workers deployment
const STATIC_FILES = {
  'index.html': Buffer.from('PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+Q1BBIEpPQlMgLSBGaW5kIFlvdXIgTmV4dCBDUEEgT3Bwb3J0dW5pdHk8L3RpdGxlPgogIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iY3NzL3N0eWxlLmNzcyI+CiAgPGJhc2UgaHJlZj0iLyI+CjwvaGVhZD4KPGJvZHk+CiAgPGhlYWRlcj4KICAgIDxuYXYgY2xhc3M9Im5hdiI+CiAgICAgIDxhIGhyZWY9IiNsYW5kaW5nIiBjbGFzcz0ibG9nbyI+Q1BBIEpPQlM8L2E+CiAgICAgIDxkaXYgY2xhc3M9Im5hdi1saW5rcyI+CiAgICAgICAgPGEgaHJlZj0iI2xhbmRpbmciPkhvbWU8L2E+CiAgICAgICAgPGEgaHJlZj0iI2NhdGVnb3JpZXMiPkNhdGVnb3JpZXM8L2E+CiAgICAgIDwvZGl2PgogICAgPC9uYXY+CiAgPC9oZWFkZXI+CgogIDxtYWluIGlkPSJhcHAiPgogICAgPCEtLSBDb250ZW50IHdpbGwgYmUgbG9hZGVkIGhlcmUgLS0+CiAgPC9tYWluPgoKICA8Zm9vdGVyPgogICAgPHA+JmNvcHk7IDIwMjQgQ1BBIEpPQlMuIFlvdXIgZ2F0ZXdheSB0byBDUEEgb3Bwb3J0dW5pdGllcy48L3A+CiAgPC9mb290ZXI+CgogIDxzY3JpcHQgc3JjPSJqcy9hcHAuanMiPjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4=', 'base64').toString('utf8'),
  'js/app.js': Buffer.from('YXBwLmpzIC0gQ1BBIEpPQlMgRnJvbnRlbmQgTVZQCgpjbGFzcyBDUEFKb2JzQXBwIHsKICBjb25zdHJ1Y3RvcigpIHsKICAgIHRoaXMuc3RhdGUgPSB7CiAgICAgIGN1cnJlbnRWaWV3OiAnbGFuZGluZycsCiAgICAgIGNhdGVnb3JpZXM6IFtdLAogICAgICBvZmZlcnM6IFtdLAogICAgICBzZWxlY3RlZENhdGVnb3J5OiBudWxsLAogICAgICBsb2FkaW5nOiBmYWxzZSwKICAgICAgZXJyb3I6IG51bGwsCiAgICAgIHNlbGVjdGVkT2ZmZXI6IG51bGwsCiAgICAgIHRyYWNraW5nRGF0YTogbnVsbAogICAgfTsKICAgIHRoaXMuYmFzZVVybCA9ICcvJzsKICAgIHRoaXMuaW5pdCgpOwogIH0KCiAgaW5pdCgpIHsKICAgIC8vIENoZWNrIFVSTCBoYXNoIGZvciBuYXZpZ2F0aW9uCiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHRoaXMuaGFuZGxlUm91dGUoKSk7CiAgICAvLyBJbml0aWFsIHJvdXRlIG9uIGxvYWQKICAgIHRoaXMuaGFuZGxlUm91dGUoKTsKICB9CgogIGFzeW5jIGhhbmRsZVJvdXRlKCkgewogICAgY29uc3QgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnNsaWNlKDEpIHx8ICdsYW5kaW5nJzsKICAgIHRoaXMuc3RhdGUuY3VycmVudFZpZXcgPSBoYXNoOwoKICAgIHN3aXRjaCAoaGFzaCkgewogICAgICBjYXNlICdsYW5kaW5nJzoKICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYW5kaW5nKCk7CiAgICAgICAgYnJlYWs7CiAgICAgIGNhc2UgJ2NhdGVnb3JpZXMnOgogICAgICAgIGF3YWl0IHRoaXMubG9hZENhdGVnb3JpZXMoKTsKICAgICAgICBicmVhazsKICAgICAgY2FzZSAnb2ZmZXItZGV0YWlsJzoKICAgICAgICB0aGlzLmxvYWRPZmZlckRldGFpbCgpOwogICAgICAgIGJyZWFrOwogICAgICBjYXNlICdhZG1pbic6CiAgICAgICAgdGhpcy5sb2FkQWRtaW4oKTsKICAgICAgICBicmVhazsKICAgICAgZGVmYXVsdDoKICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYW5kaW5nKCk7CiAgICB9CgogICAgdGhpcy5yZW5kZXIoKTsKICB9CgogIGFzeW5jIGxvYWRMYW5kaW5nKCkgewogICAgdHJ5IHsKICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpOwogICAgICB0aGlzLnN0YXRlLmVycm9yID0gbnVsbDsKCiAgICAgIC8vIExvYWQgZmVhdHVyZWQgb2ZmZXJzCiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvb2ZmZXJzJywgeyBzdGF0dXM6ICdhY3RpdmUnLCBsaW1pdDogNiB9KTsKICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7CiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsKICAgICAgICB0aGlzLnN0YXRlLm9mZmVycyA9IGRhdGEub2ZmZXJzIHx8IFtdOwogICAgICB9CgogICAgICAvLyBMb2FkIGNhdGVnb3JpZXMgZm9yIG5hdmlnYXRpb24KICAgICAgY29uc3QgY2F0ZWdvcmllc1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvY2F0ZWdvcmllcycpOwogICAgICBpZiAoY2F0ZWdvcmllc1Jlc3BvbnNlLm9rKSB7CiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNhdGVnb3JpZXNSZXNwb25zZS5qc29uKCk7CiAgICAgICAgdGhpcy5zdGF0ZS5jYXRlZ29yaWVzID0gZGF0YS5jYXRlZ29yaWVzIHx8IFtdOwogICAgICB9CgogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgdGhpcy5zdGF0ZS5lcnJvciA9ICdGYWlsZWQgdG8gbG9hZCBsYW5kaW5nIHBhZ2UgZGF0YSc7CiAgICAgIGNvbnNvbGUuZXJyb3IoJ0xhbmRpbmcgbG9hZCBlcnJvcjonLCBlcnJvcik7CiAgICB9IGZpbmFsbHkgewogICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpOwogICAgfQogIH0KCiAgYXN5bmMgbG9hZENhdGVnb3JpZXMoKSB7CiAgICB0cnkgewogICAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7CiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSBudWxsOwoKICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmFwaUNhbGwoJy9jYXRlZ29yaWVzJyk7CiAgICAgIGlmIChyZXNwb25zZS5vaykgewogICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7CiAgICAgICAgdGhpcy5zdGF0ZS5jYXRlZ29yaWVzID0gZGF0YS5jYXRlZ29yaWVzIHx8IFtdOwogICAgICB9CgogICAgICAvLyBBbHNvIGxvYWQgb2ZmZXJzIGZvciBjYXRlZ29yeSBwYWdlCiAgICAgIGNvbnN0IG9mZmVyc1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvb2ZmZXJzJywgeyBzdGF0dXM6ICdhY3RpdmUnLCBsaW1pdDogMjAgfSk7CiAgICAgIGlmIChvZmZlcnNSZXNwb25zZS5vaykgewogICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBvZmZlcnNSZXNwb25zZS5qc29uKCk7CiAgICAgICAgdGhpcy5zdGF0ZS5vZmZlcnMgPSBkYXRhLm9mZmVycyB8fCBbXTsKICAgICAgfQoKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSAnRmFpbGVkIHRvIGxvYWQgY2F0ZWdvcmllcyc7CiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NhdGVnb3JpZXMgbG9hZCBlcnJvcjonLCBlcnJvcik7CiAgICB9IGZpbmFsbHkgewogICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpOwogICAgfQogIH0KCiAgbG9hZE9mZmVyRGV0YWlsKCkgewogICAgY29uc3QgdXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTsKICAgIGNvbnN0IG9mZmVySWQgPSB1cmxQYXJhbXMuZ2V0KCdpZCcpOwoKICAgIGlmICghb2ZmZXJJZCkgewogICAgICB0aGlzLnN0YXRlLmVycm9yID0gJ09mZmVyIElEIG5vdCBmb3VuZCc7CiAgICAgIHRoaXMubmF2aWdhdGUoJ2xhbmRpbmcnKTsKICAgICAgcmV0dXJuOwogICAgfQoKICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTsKICAgIHRoaXMuc3RhdGUuZXJyb3IgPSBudWxsOwoKICAgIC8vIExvYWQgc3BlY2lmaWMgb2ZmZXIKICAgIHRoaXMuYXBpQ2FsbChgL29mZmVycy8ke29mZmVySWR9YCkKICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gewogICAgICAgIGlmIChyZXNwb25zZS5vaykgewogICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPZmZlciBub3QgZm91bmQnKTsKICAgICAgICB9CiAgICAgIH0pCiAgICAgIC50aGVuKGRhdGEgPT4gewogICAgICAgIHRoaXMuc3RhdGUuc2VsZWN0ZWRPZmZlciA9IGRhdGE7CiAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTsKICAgICAgfSkKICAgICAgLmNhdGNoKGVycm9yID0+IHsKICAgICAgICB0aGlzLnN0YXRlLmVycm9yID0gJ0ZhaWxlZCB0byBsb2FkIG9mZmVyIGRldGFpbHMnOwogICAgICAgIGNvbnNvbGUuZXJyb3IoJ09mZmVyIGRldGFpbCBlcnJvcjonLCBlcnJvcik7CiAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTsKICAgICAgfSk7CiAgfQoKICBsb2FkQWRtaW4oKSB7CiAgICAvLyBBZG1pbiB2aWV3IHVzZXMgZXhpc3RpbmcgYmFja2VuZCBlbmRwb2ludHMKICAgIHRoaXMuc3RhdGUuY3VycmVudFZpZXcgPSAnYWRtaW4nOwogICAgdGhpcy5yZW5kZXIoKTsKICB9CgogIGFzeW5jIHRyYWNrQ2xpY2sob2ZmZXJJZCwgdXNlckRhdGEgPSB7fSkgewogICAgdHJ5IHsKICAgICAgY29uc3QgcGF5bG9hZCA9IHsKICAgICAgICBvZmZlcl9pZDogb2ZmZXJJZCwKICAgICAgICBpcF9hZGRyZXNzOiB1c2VyRGF0YS5pcCB8fCAndW5rbm93bicsCiAgICAgICAgdXNlcl9hZ2VudDogdXNlckRhdGEudXNlckFnZW50IHx8ICcnLAogICAgICAgIHJlZmVycmVyOiB1c2VyRGF0YS5yZWZlcnJlciB8fCAnJywKICAgICAgICBtZXRhZGF0YTogdXNlckRhdGEubWV0YWRhdGEgfHwge30KICAgICAgfTsKCiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvdHJhY2svY2xpY2snLCAnUE9TVCcsIHBheWxvYWQpOwogICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpOwoKICAgICAgcmV0dXJuIHsKICAgICAgICBzdWNjZXNzOiByZXNwb25zZS5vaywKICAgICAgICBjbGlja0lkOiBkYXRhLmNsaWNrX2lkLAogICAgICAgIG1lc3NhZ2U6IGRhdGEubWVzc2FnZSwKICAgICAgICBlcnJvcjogIXJlc3BvbnNlLm9rID8gZGF0YS5lcnJvciA6IG51bGwKICAgICAgfTsKCiAgICB9IGNhdGNoIChlcnJvcikgewogICAgICBjb25zb2xlLmVycm9yKCdDbGljayB0cmFja2luZyBlcnJvcjonLCBlcnJvcik7CiAgICAgIHJldHVybiB7CiAgICAgICAgc3VjY2VzczogZmFsc2UsCiAgICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gdHJhY2sgY2xpY2snCiAgICAgIH07CiAgICB9CiAgfQoKICBhc3luYyBhcGlDYWxsKGVuZHBvaW50LCBwYXJhbXMgPSBudWxsLCBib2R5ID0gbnVsbCkgewogICAgLy8gSGFuZGxlIGJvdGggb2xkIHNpZ25hdHVyZSAobWV0aG9kIGFzIHN0cmluZykgYW5kIG5ldyBzaWduYXR1cmUgKHBhcmFtcyBhcyBvYmplY3QpCiAgICBsZXQgbWV0aG9kID0gJ0dFVCc7CiAgICBsZXQgcXVlcnlQYXJhbXMgPSBudWxsOwoKICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSAnc3RyaW5nJykgewogICAgICAvLyBPbGQgc2lnbmF0dXJlOiBhcGlDYWxsKGVuZHBvaW50LCBtZXRob2QsIGJvZHkpCiAgICAgIG1ldGhvZCA9IHBhcmFtczsKICAgICAgcXVlcnlQYXJhbXMgPSBudWxsOwogICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyAmJiBwYXJhbXMgIT09IG51bGwgJiYgYm9keSA9PT0gbnVsbCkgewogICAgICAvLyBOZXcgc2lnbmF0dXJlOiBhcGlDYWxsKGVuZHBvaW50LCB7cGFyYW1zfSkKICAgICAgcXVlcnlQYXJhbXMgPSBwYXJhbXM7CiAgICAgIG1ldGhvZCA9ICdHRVQnOwogICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYm9keSA9PT0gJ29iamVjdCcpIHsKICAgICAgLy8gTmV3IHNpZ25hdHVyZTogYXBpQ2FsbChlbmRwb2ludCwgcGFyYW1zLCBib2R5KQogICAgICBxdWVyeVBhcmFtcyA9IHBhcmFtczsKICAgICAgbWV0aG9kID0gJ1BPU1QnOwogICAgfQoKICAgIGxldCB1cmwgPSB0aGlzLmJhc2VVcmwgKyBlbmRwb2ludDsKCiAgICAvLyBCdWlsZCBxdWVyeSBzdHJpbmcgaWYgcGFyYW1zIHByb3ZpZGVkCiAgICBpZiAocXVlcnlQYXJhbXMgJiYgbWV0aG9kID09PSAnR0VUJykgewogICAgICBjb25zdCBzZWFyY2hQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKCk7CiAgICAgIE9iamVjdC5rZXlzKHF1ZXJ5UGFyYW1zKS5mb3JFYWNoKGtleSA9PiB7CiAgICAgICAgaWYgKHF1ZXJ5UGFyYW1zW2tleV0gIT09IG51bGwgJiYgcXVlcnlQYXJhbXNba2V5XSAhPT0gdW5kZWZpbmVkKSB7CiAgICAgICAgICBzZWFyY2hQYXJhbXMuYXBwZW5kKGtleSwgcXVlcnlQYXJhbXNba2V5XSk7CiAgICAgICAgfQogICAgICB9KTsKICAgICAgaWYgKHNlYXJjaFBhcmFtcy50b1N0cmluZygpKSB7CiAgICAgICAgdXJsICs9ICc/JyArIHNlYXJjaFBhcmFtcy50b1N0cmluZygpOwogICAgICB9CiAgICB9CgogICAgY29uc3Qgb3B0aW9ucyA9IHsKICAgICAgbWV0aG9kLAogICAgICBoZWFkZXJzOiB7CiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJwogICAgICB9CiAgICB9OwoKICAgIGlmIChib2R5KSB7CiAgICAgIG9wdGlvbnMuYm9keSA9IEpTT04uc3RyaW5naWZ5KGJvZHkpOwogICAgfQoKICAgIHRyeSB7CiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCBvcHRpb25zKTsKICAgICAgcmV0dXJuIHJlc3BvbnNlOwogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgY29uc29sZS5lcnJvcignQVBJIGNhbGwgZXJyb3I6JywgZXJyb3IpOwogICAgICB0aHJvdyBlcnJvcjsKICAgIH0KICB9CgogIHNldExvYWRpbmcoaXNMb2FkaW5nKSB7CiAgICB0aGlzLnN0YXRlLmxvYWRpbmcgPSBpc0xvYWRpbmc7CiAgICB0aGlzLnJlbmRlcigpOwogIH0KCiAgbmF2aWdhdGUocGF0aCkgewogICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBwYXRoOwogIH0KCiAgcmVuZGVyKCkgewogICAgY29uc3QgYXBwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpOwogICAgaWYgKCFhcHApIHJldHVybjsKCiAgICBsZXQgaHRtbCA9ICcnOwoKICAgIHN3aXRjaCAodGhpcy5zdGF0ZS5jdXJyZW50VmlldykgewogICAgICBjYXNlICdsYW5kaW5nJzoKICAgICAgICBodG1sID0gdGhpcy5yZW5kZXJMYW5kaW5nKCk7CiAgICAgICAgYnJlYWs7CiAgICAgIGNhc2UgJ2NhdGVnb3JpZXMnOgogICAgICAgIGh0bWwgPSB0aGlzLnJlbmRlckNhdGVnb3JpZXMoKTsKICAgICAgICBicmVhazsKICAgICAgY2FzZSAnb2ZmZXItZGV0YWlsJzoKICAgICAgICBodG1sID0gdGhpcy5yZW5kZXJPZmZlckRldGFpbCgpOwogICAgICAgIGJyZWFrOwogICAgICBjYXNlICdhZG1pbic6CiAgICAgICAgaHRtbCA9IHRoaXMucmVuZGVyQWRtaW4oKTsKICAgICAgICBicmVhazsKICAgICAgZGVmYXVsdDoKICAgICAgICBodG1sID0gdGhpcy5yZW5kZXJMYW5kaW5nKCk7CiAgICB9CgogICAgYXBwLmlubmVySFRNTCA9IGh0bWw7CiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKCk7CiAgfQoKICByZW5kZXJMYW5kaW5nKCkgewogICAgcmV0dXJuIGAKICAgICAgPHNlY3Rpb24gY2xhc3M9Imhlcm8iPgogICAgICAgIDxoMT5GaW5kIFlvdXIgTmV4dCBDUEEgT3Bwb3J0dW5pdHk8L2gxPgogICAgICAgIDxwPkRpc2NvdmVyIGhpZ2gtcGF5aW5nIENQQSBwcm9ncmFtcyBhbmQgc3RhcnQgZWFybmluZyB0b2RheTwvcD4KICAgICAgICAke3RoaXMuc3RhdGUubG9hZGluZyA/ICc8cD5Mb2FkaW5nLi4uPC9wPicgOiAnJ30KICAgICAgICAke3RoaXMuc3RhdGUuZXJyb3IgPyBgPHAgY2xhc3M9ImVycm9yIj4ke3RoaXMuc3RhdGUuZXJyb3J9PC9wPmAgOiAnJ30KICAgICAgPC9zZWN0aW9uPgoKICAgICAgPHNlY3Rpb24gY2xhc3M9Im9mZmVyLWxpc3QiPgogICAgICAgIDxoMj5GZWF0dXJlZCBPcHBvcnR1bml0aWVzPC9oMj4KICAgICAgICAke3RoaXMuc3RhdGUub2ZmZXJzLm1hcChvZmZlciA9PiB0aGlzLnJlbmRlck9mZmVyQ2FyZChvZmZlcikpLmpvaW4oJycpfQogICAgICA8L3NlY3Rpb24+CgogICAgICA8c2VjdGlvbiBjbGFzcz0ib2ZmZXItbGlzdCI+CiAgICAgICAgPGgyPkJyb3dzZSBDYXRlZ29yaWVzPC9oMj4KICAgICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yeS1ncmlkIj4KICAgICAgICAgICR7dGhpcy5zdGF0ZS5jYXRlZ29yaWVzLm1hcChjYXQgPT4gYAogICAgICAgICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yeS1jYXJkIiBvbmNsaWNrPSJhcHAubmF2aWdhdGUoJ2NhdGVnb3JpZXMnKSI+CiAgICAgICAgICAgICAgPGgzPiR7Y2F0Lm5hbWV9PC9oMz4KICAgICAgICAgICAgICA8cD4ke2NhdC5kZXNjcmlwdGlvbn08L3A+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgPC9idXR0b24+CiAgICAgICAgPC9kaXY+CiAgICAgIDwvc2VjdGlvbj4KICAgIGA7CiAgfQoKICByZW5kZXJDYXRlZ29yaWVzKCkgewogICAgY29uc3QgZmlsdGVyZWRPZmZlcnMgPSB0aGlzLnN0YXRlLnNlbGVjdGVkQ2F0ZWdvcnkKICAgICAgPyB0aGlzLnN0YXRlLm9mZmVycy5maWx0ZXIob2ZmZXIgPT4gb2ZmZXIuY2F0ZWdvcnk/LnNsdWcgPT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRDYXRlZ29yeSkKICAgICAgOiB0aGlzLnN0YXRlLm9mZmVyczsKCiAgICByZXR1cm4gYAogICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yaWVzLWNvbnRhaW5lciI+CiAgICAgICAgPGgyPkNhdGVnb3JpZXM8L2gyPgogICAgICAgIDxkaXYgY2xhc3M9ImNhdGVnb3J5LWZpbHRlcnMiPgogICAgICAgICAgPGJ1dHRvbiBjbGFzcz0iY2F0ZWdvcnktZmlsdGVyICR7IXRoaXMuc3RhdGUuc2VsZWN0ZWRDYXRlZ29yeSA/ICdhY3RpdmUnIDogJyd9IiBvbmNsaWNrPSJhcHAuc2V0U2VsZWN0ZWRDYXRlZ29yeShudWxsKSI+CiAgICAgICAgICAgIEFsbAogICAgICAgICAgPC9idXR0b24+CiAgICAgICAgICAke3RoaXMuc3RhdGUuY2F0ZWdvcmllcy5tYXAoY2F0ID0+IGAKICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz0iY2F0ZWdvcnktZmlsdGVyICR7dGhpcy5zdGF0ZS5zZWxlY3RlZENhdGVnb3J5ID09PSBjYXQuc2x1ZyA/ICdhY3RpdmUnIDogJyd9IiBvbmNsaWNrPSJhcHAuc2V0U2VsZWN0ZWRDYXRlZ29yeSgnJHtjYXQuc2x1Z30nKSI+CiAgICAgICAgICAgICAgJHtjYXQubmFtZX0KICAgICAgICAgICAgPC9idXR0b24+CiAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICA8L2Rpdj4KCiAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItZ3JpZCI+CiAgICAgICAgICAke2ZpbHRlcmVkT2ZmZXJzLm1hcChvZmZlciA9PiB0aGlzLnJlbmRlck9mZmVyQ2FyZChvZmZlcikpLmpvaW4oJycpfQogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgIGA7CiAgfQoKICByZW5kZXJPZmZlckRldGFpbCgpIHsKICAgIGlmICghdGhpcy5zdGF0ZS5zZWxlY3RlZE9mZmVyKSB7CiAgICAgIHJldHVybiBgPHA+T2ZmZXIgbm90IGZvdW5kIG9yIGxvYWRpbmcuLi48L3A+YDsKICAgIH0KCiAgICBjb25zdCBvZmZlciA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRPZmZlcjsKCiAgICByZXR1cm4gYAogICAgICA8ZGl2IGNsYXNzPSJvZmZlci1kZXRhaWwiPgogICAgICAgIDxidXR0b24gb25jbGljaz0iYXBwLm5hdmlnYXRlKCdsYW5kaW5nJykiIGNsYXNzPSJiYWNrLWJ0biI+4oaQIEJhY2s8L2J1dHRvbj4KCiAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItZGV0YWlsLWNhcmQiPgogICAgICAgICAgPGgxPiR7b2ZmZXIudGl0bGV9PC9oMT4KICAgICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLW1ldGEiPgogICAgICAgICAgICA8c3BhbiBjbGFzcz0iY2F0ZWdvcnkiPiR7b2ZmZXIuY2F0ZWdvcnk/Lm5hbWUgfHwgJ0dlbmVyYWwnfTwvc3Bhbj4KICAgICAgICAgICAgPHNwYW4gY2xhc3M9InN0YXR1cyI+JHtvZmZlci5zdGF0dXN9PC9zcGFuPgogICAgICAgICAgPC9kaXY+CgogICAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItZGVzY3JpcHRpb24iPgogICAgICAgICAgICA8aDM+RGVzY3JpcHRpb248L2gzPgogICAgICAgICAgICA8cD4ke29mZmVyLmRlc2NyaXB0aW9ufTwvcD4KICAgICAgICAgIDwvZGl2PgoKICAgICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLWluZm8iPgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpbmZvLWl0ZW0iPgogICAgICAgICAgICAgIDxzdHJvbmc+UGF5b3V0Ojwvc3Ryb25nPiAkJHtvZmZlci5wYXlvdXR9ICR7b2ZmZXIucGF5b3V0X3R5cGV9CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpbmZvLWl0ZW0iPgogICAgICAgICAgICAgIDxzdHJvbmc+RXhwaXJlczo8L3N0cm9uZz4gJHtvZmZlci5leHBpcmVzX2F0ID8gbmV3IERhdGUob2ZmZXIuZXhwaXJlc19hdCkudG9Mb2NhbGVEYXRlU3RyaW5nKCkgOiAnTm8gZXhwaXJhdGlvbid9CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpbmZvLWl0ZW0iPgogICAgICAgICAgICAgIDxzdHJvbmc+Q2xpY2tzOjwvc3Ryb25nPiAke29mZmVyLmNsaWNrX2NvdW50IHx8IDB9CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpbmZvLWl0ZW0iPgogICAgICAgICAgICAgIDxzdHJvbmc+Q29udmVyc2lvbnM6PC9zdHJvbmc+ICR7b2ZmZXIuY29udmVyc2lvbl9jb3VudCB8fCAwfQogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIDwvZGl2PgoKICAgICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLXJlcXVpcmVtZW50cyI+CiAgICAgICAgICAgIDxoMz5SZXF1aXJlbWVudHM8L2gzPgogICAgICAgICAgICA8dWw+CiAgICAgICAgICAgICAgJHtvZmZlci5yZXF1aXJlbWVudHM/Lm1hcChyZXEgPT4gYDxsaT4ke3JlcX08L2xpPmApLmpvaW4oJycpIHx8ICc8bGk+Tm8gc3BlY2lmaWMgcmVxdWlyZW1lbnRzPC9saT4nfQogICAgICAgICAgICA8L2Rpdj4KCiAgICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1jdGEiPgogICAgICAgICAgICA8YSBocmVmPSIke29mZmVyLnVybH0iIHRhcmdldD0iX2JsYW5rIiBjbGFzcz0iY3RhLWJ1dHRvbiIgb25jbGljaz0iYXBwLmhhbmRsZU9mZmVyQ2xpY2soJyR7b2ZmZXIuaWR9JykiPgogICAgICAgICAgICAgIEFwcGx5IE5vdwogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgIGA7CiAgfQoKICByZW5kZXJBZG1pbigpIHsKICAgIHJldHVybiBgCiAgICAgIDxkaXYgY2xhc3M9ImFkbWluLXBhbmVsIj4KICAgICAgICA8aDI+QWRtaW4gRGFzaGJvYXJkPC9oMj4KICAgICAgICA8cD5BZG1pbiBmdW5jdGlvbmFsaXR5IHVzaW5nIGV4aXN0aW5nIGJhY2tlbmQgZW5kcG9pbnRzPC9wPgoKICAgICAgICA8ZGl2IGNsYXNzPSJhZG1pbi1hY3Rpb25zIj4KICAgICAgICAgIDxidXR0b24gb25jbGljaz0iYXBwLm5hdmlnYXRlKCdsYW5kaW5nJykiIGNsYXNzPSJhZG1pbi1idG4iPkJhY2sgdG8gU2l0ZTwvYnV0dG9uPgogICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJhcHAubG9hZE9mZmVyc0FkbWluKCkiIGNsYXNzPSJhZG1pbi1idG4iPk1hbmFnZSBPZmZlcnM8L2J1dHRvbj4KICAgICAgICAgIDxidXR0b24gb25jbGljaz0iYXBwLmxvYWRSZXZlbnVlQWRtaW4oKSIgY2xhc3M9ImFkbWluLWJ0biI+VmlldyBSZXZlbnVlPC9idXR0b24+CiAgICAgICAgPC9kaXY+CgogICAgICAgIDxkaXYgaWQ9ImFkbWluLWNvbnRlbnQiPgogICAgICAgICAgPHA+QWRtaW4gaW50ZXJmYWNlIGNvbWluZyBzb29uLi4uPC9wPgogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgIGA7CiAgfQoKICByZW5kZXJPZmZlckNhcmQob2ZmZXIpIHsKICAgIHJldHVybiBgCiAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLWNhcmQiIG9uY2xpY2s9ImFwcC5uYXZpZ2F0ZSgnb2ZmZXItZGV0YWlsP2lkPSR7b2ZmZXIuaWR9JykiPgogICAgICAgIDxoMz4ke29mZmVyLnRpdGxlfTwvaDM+CiAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItbWV0YSI+CiAgICAgICAgICA8c3BhbiBjbGFzcz0iY2F0ZWdvcnkiPiR7b2ZmZXIuY2F0ZWdvcnk/Lm5hbWUgfHwgJ0dlbmVyYWwnfTwvc3Bhbj4KICAgICAgICAgIDxzcGFuIGNsYXNzPSJzdGF0dXMgJHtvZmZlci5zdGF0dXN9Ij4ke29mZmVyLnN0YXR1c308L3NwYW4+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPHAgY2xhc3M9ImRlc2NyaXB0aW9uIj4ke29mZmVyLmRlc2NyaXB0aW9ufTwvcD4KICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1mb290ZXIiPgogICAgICAgICAgPHNwYW4gY2xhc3M9InBheW91dCI+JCR7b2ZmZXIucGF5b3V0fSAke29mZmVyLnBheW91dF90eXBlfTwvc3Bhbj4KICAgICAgICAgIDxzcGFuIGNsYXNzPSJzdGF0dXMgJHtvZmZlci5zdGF0dXN9Ij4ke29mZmVyLnN0YXR1c308L3NwYW4+CiAgICAgICAgPC9kaXY+CiAgICAgIDwvZGl2PgogICAgYDsKICB9CgogIHNldFNlbGVjdGVkQ2F0ZWdvcnkoY2F0ZWdvcnkpIHsKICAgIHRoaXMuc3RhdGUuc2VsZWN0ZWRDYXRlZ29yeSA9IGNhdGVnb3J5OwogICAgdGhpcy5yZW5kZXIoKTsKICB9CgogIGFzeW5jIGhhbmRsZU9mZmVyQ2xpY2sob2ZmZXJJZCkgewogICAgY29uc3QgY2xpY2tEYXRhID0gewogICAgICBvZmZlcl9pZDogb2ZmZXJJZCwKICAgICAgaXBfYWRkcmVzczogJ3Vua25vd24nLAogICAgICB1c2VyX2FnZW50OiBuYXZpZ2F0b3IudXNlckFnZW50LAogICAgICByZWZlcnJlcjogZG9jdW1lbnQucmVmZXJyZXIsCiAgICAgIG1ldGFkYXRhOiB7CiAgICAgICAgc291cmNlOiAnZnJvbnRlbmRfbXZwJywKICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKQogICAgICB9CiAgICB9OwoKICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMudHJhY2tDbGljayhvZmZlcklkLCBjbGlja0RhdGEpOwoKICAgIGlmIChyZXN1bHQuc3VjY2VzcykgewogICAgICBjb25zb2xlLmxvZygnQ2xpY2sgdHJhY2tlZCBzdWNjZXNzZnVsbHk6JywgcmVzdWx0KTsKICAgICAgLy8gVGhlIGJhY2tlbmQgaGFuZGxlcyB0aGUgYWN0dWFsIHJlZGlyZWN0IHRvIHRoZSBDUEEgZGVzdGluYXRpb24KICAgICAgLy8gV2UganVzdCBuZWVkIHRvIHRyYWNrIHRoZSBjbGljayBhbmQgbGV0IHRoZSBiYWNrZW5kIGhhbmRsZSB0aGUgcmVkaXJlY3QKICAgICAgcmV0dXJuIHRydWU7CiAgICB9IGVsc2UgewogICAgICBjb25zb2xlLmVycm9yKCdDbGljayB0cmFja2luZyBmYWlsZWQ6JywgcmVzdWx0LmVycm9yKTsKICAgICAgLy8gU2hvdyBlcnJvciBzdGF0ZSBidXQgY29udGludWUgbmF2aWdhdGlvbgogICAgICB0aGlzLnN0YXRlLmVycm9yID0gcmVzdWx0LmVycm9yIHx8ICdUcmFja2luZyBmYWlsZWQnOwogICAgICB0aGlzLnJlbmRlcigpOwogICAgICByZXR1cm4gZmFsc2U7CiAgICB9CiAgfQp9CgovLyBJbml0aWFsaXplIHRoZSBhcHAgd2hlbiBET00gaXMgcmVhZHkKaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykgewogIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7CiAgICB3aW5kb3cuYXBwID0gbmV3IENQQUpvYnNBcHAoKTsKICB9KTsKfSBlbHNlIHsKICB3aW5kb3cuYXBwID0gbmV3IENQQUpvYnNBcHAoKTsKfQ==', 'base64').toString('utf8'),
  'css/style.css': Buffer.from('Lyogc3RhdGljL2Nzcy9zdHlsZS5jc3MgLSBDUEEgSk9CUyBNVlAgU3R5bGVzDQogICBQaGFzZSAwOiBGb3VuZGF0aW9uIC0gQmFzaWMgc3R5bGluZyAqLw0KDQpib2R5IHsNCiAgZm9udC1mYW1pbHk6IHN5c3RlbS11aSwgLWFwcGxlLXN5c3RlbSwgc2Fucy1zZXJpZjsNCiAgbWFyZ2luOiAwOw0KICBwYWRkaW5nOiAwOw0KICBiYWNrZ3JvdW5kOiAjZmFmYWZhOw0KICBjb2xvcjogIzMzMzsNCn0NCg0KaGVhZGVyIHsNCiAgYmFja2dyb3VuZDogI2ZmZjsNCiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMGUwZTA7DQogIHBhZGRpbmc6IDFyZW0gMnJlbTsNCn0NCg0KLm5hdiB7DQogIG1heC13aWR0aDogMTIwMHB4Ow0KICBtYXJnaW46IDAgYXV0bzsNCiAgZGlzcGxheTogZmxleDsNCiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOw0KICBhbGlnbi1pdGVtczogY2VudGVyOw0KfQ0KDQoubG9nbyB7DQogIGZvbnQtc2l6ZTogMS41cmVtOw0KICBmb250LXdlaWdodDogYm9sZDsNCiAgY29sb3I6ICMwMDdhY2M7DQogIHRleHQtZGVjb3JhdGlvbjogbm9uZTsNCn0NCg0KLm5hdi1saW5rcyBhIHsNCiAgbWFyZ2luLWxlZnQ6IDFyZW07DQogIGNvbG9yOiAjMzMzOw0KICB0ZXh0LWRlY29yYXRpb246IG5vbmU7DQogIGZvbnQtc2l6ZTogMC45cmVtOw0KfQ0KDQouaGVybyB7DQogIG1heC13aWR0aDogMTIwMHB4Ow0KICBtYXJnaW46IDNyZW0gYXV0bzsNCiAgcGFkZGluZzogMnJlbTsNCiAgdGV4dC1hbGlnbjogY2VudGVyOw0KICBiYWNrZ3JvdW5kOiAjZmZmOw0KICBib3JkZXItcmFkaXVzOiA4cHg7DQogIGJveC1zaGFkb3c6IDAgMnB4IDRweCByZ2JhKDAsMCwwLDAuMSk7DQp9DQoNCi5oZXJvIGgxIHsNCiAgZm9udC1zaXplOiAycmVtOw0KICBtYXJnaW4tYm90dG9tOiAxcmVtOw0KfQ0KDQouaGVybyBwIHsNCiAgY29sb3I6ICM2NjY7DQogIG1hcmdpbi1ib3R0b206IDJyZW07DQp9DQoNCi5vZmZlci1saXN0IHsNCiAgbWF4LXdpZHRoOiAxMjAwcHg7DQogIG1hcmdpbjogMnJlbSBhdXRvOw0KfQ0KDQoub2ZmZXItY2FyZCB7DQogIGJhY2tncm91bmQ6ICNmZmY7DQogIGJvcmRlcjogMXB4IHNvbGlkICNlMGUwZTA7DQogIGJvcmRlci1yYWRpdXM6IDhweDsNCiAgcGFkZGluZzogMXJlbTsNCiAgbWFyZ2luLWJvdHRvbTogMXJlbTsNCn0NCg0KLm9mZmVyLWNhcmQgaDMgew0KICBtYXJnaW46IDAgMCAwLjVyZW0gMDsNCiAgZm9udC1zaXplOiAxLjFyZW07DQp9DQoNCi5vZmZlci1jYXJkIHAgew0KICBjb2xvcjogIzY2NjsNCiAgZm9udC1zaXplOiAwLjlyZW07DQogIG1hcmdpbjogMC4ycmVtIDA7DQp9DQoNCmZvb3RlciB7DQogIGJhY2tncm91bmQ6ICNmZmY7DQogIGJvcmRlci10b3A6IDFweCBzb2xpZCAjZTBlMGUwOw0KICBwYWRkaW5nOiAxcmVtIDJyZW07DQogIHRleHQtYWxpZ246IGNlbnRlcjsNCiAgZm9udC1zaXplOiAwLjhyZW07DQogIGNvbG9yOiAjODg4Ow0KfQ0K', 'base64').toString('utf8'),
};

// Health check endpoint - checks infrastructure status
const health = async (event, env) => {
  // Try to connect to D1 database
  let dbStatus = 'disconnected';
  let kvStatus = 'unavailable';

  try {
    const result = await env.DB.prepare('SELECT 1').first();
    if (result) dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  try {
    const kv = await env.CPAJOBS_KV.get('health_check');
    kvStatus = 'available';
  } catch (error) {
    kvStatus = 'unavailable';
  }

  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    cache: kvStatus,
    phase: '2-offer-engine'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Categories endpoints
const categories = async (req, env) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM categories WHERE status = ? ORDER BY name').bind('active').all();
    return new Response(JSON.stringify({ categories: result.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Categories error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Offers endpoints
const offers = async (req, env) => {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;

    const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM offers WHERE status = ?').bind('active').first();
    const total = countResult?.total || 0;

    const result = await env.DB.prepare(`
      SELECT id, title, description, url, payout, payout_type, status, category_id, source_id, click_count, conversion_count, revenue
      FROM offers
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind('active', limit, offset).all();

    const offers = result.results || [];

    // Get categories for each offer
    const offersWithCategory = await Promise.all(offers.map(async (o) => {
      const cat = await env.DB.prepare('SELECT id, name, slug FROM categories WHERE id = ?').bind(o.category_id).first();
      return {
        ...o,
        category: cat || { id: o.category_id, name: 'General', slug: 'general' }
      };
    }));

    return new Response(JSON.stringify({
      offers: offersWithCategory,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Offers error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch offers', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Get single offer by ID
const getOffer = async (offerId, env) => {
  try {
    const result = await env.DB.prepare(`
      SELECT o.*, c.id as category_id, c.name, c.slug
      FROM offers o
      LEFT JOIN categories c ON o.category_id = c.id
      WHERE o.id = ?
    `).bind(offerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Offer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const offer = {
      ...result,
      category: { id: result.category_id, name: result.name, slug: result.slug }
    };

    return new Response(JSON.stringify(offer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get offer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch offer' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Admin: Create offer
const createOffer = async (req, env) => {
  try {
    const data = await req.json();
    const id = `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await env.DB.prepare(`
      INSERT INTO offers (id, title, description, category_id, source_id, url, payout, payout_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.title,
      data.description,
      data.category_id,
      data.source_id,
      data.url,
      data.payout || 0,
      data.payout_type || 'cpa',
      data.status || 'active'
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create offer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create offer' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Admin: Update offer
const updateOffer = async (offerId, req, env) => {
  try {
    const data = await req.json();

    await env.DB.prepare(`
      UPDATE offers
      SET title = ?, description = ?, category_id = ?, payout = ?, payout_type = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      data.title,
      data.description,
      data.category_id,
      data.payout,
      data.payout_type,
      data.status,
      offerId
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update offer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update offer' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Admin: Expire offer
const expireOffer = async (offerId, env) => {
  try {
    await env.DB.prepare(`
      UPDATE offers
      SET status = 'expired', expires_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(offerId).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Expire offer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to expire offer' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Click tracking
const trackClick = async (req, env) => {
  try {
    const data = await req.json();
    const id = `click-${data.offer_id}-${data.ip_address}-${Date.now()}`;

    await env.DB.prepare(`
      INSERT INTO clicks (id, offer_id, ip_address, user_agent, referrer, timestamp)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      id,
      data.offer_id,
      data.ip_address,
      data.user_agent || '',
      data.referrer || ''
    ).run();

    // Increment click count
    await env.DB.prepare(`
      UPDATE offers SET click_count = click_count + 1 WHERE id = ?
    `).bind(data.offer_id).run();

    return new Response(JSON.stringify({ success: true, click_id: id, message: 'Click tracked successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Click tracking error:', error);
    return new Response(JSON.stringify({ error: 'Failed to track click' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Revenue tracking
const trackConversion = async (req, env) => {
  try {
    const data = await req.json();
    const id = `conversion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await env.DB.prepare(`
      INSERT INTO conversions (id, offer_id, source, amount, timestamp, status)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'pending')
    `).bind(
      id,
      data.offer_id,
      data.source || 'web',
      data.amount || 0
    ).run();

    // Increment conversion count
    await env.DB.prepare(`
      UPDATE offers SET conversion_count = conversion_count + 1 WHERE id = ?
    `).bind(data.offer_id).run();

    return new Response(JSON.stringify({ success: true, conversion_id: id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Conversion tracking error:', error);
    return new Response(JSON.stringify({ error: 'Failed to track conversion' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Admin: Revenue report
const revenueReport = async (req, env) => {
  try {
    const result = await env.DB.prepare(`
      SELECT SUM(revenue) as total, COUNT(*) as offers_count FROM offers WHERE status = 'active'
    `).first();

    return new Response(JSON.stringify({
      total_revenue: result?.total || 0,
      active_offers: result?.offers_count || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Serve static files
const serveStatic = async (pathname) => {
  const filePath = pathname === '/' ? 'index.html' : pathname.substring(1);
  const content = STATIC_FILES[filePath];

  if (!content) {
    return new Response('Not found', { status: 404 });
  }

  const contentType = filePath.endsWith('.js') ? 'application/javascript' :
                      filePath.endsWith('.css') ? 'text/css' :
                      filePath.endsWith('.html') ? 'text/html' : 'text/plain';

  return new Response(content, {
    status: 200,
    headers: { 'Content-Type': contentType }
  });
};

// Cloudflare Workers fetch event handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check endpoint
    if (path === '/health') {
      return health(request, env);
    }

    // Static files
    if (path === '/' || path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.html')) {
      return serveStatic(path);
    }

    // API routes
    if (path === '/categories') {
      return categories(request, env);
    }

    if (path === '/offers' && request.method === 'GET') {
      return offers(request, env);
    }

    if (path.match(/^\/offers\/[^\/]+$/) && request.method === 'GET') {
      const offerId = path.split('/')[2];
      return getOffer(offerId, env);
    }

    if (path === '/admin/offers' && request.method === 'POST') {
      return createOffer(request, env);
    }

    if (path.match(/^\/admin\/offers\/[^\/]+$/) && request.method === 'PUT') {
      const offerId = path.split('/')[3];
      return updateOffer(offerId, request, env);
    }

    if (path.match(/^\/admin\/offers\/[^\/]+\/expire$/) && request.method === 'POST') {
      const offerId = path.split('/')[3];
      return expireOffer(offerId, env);
    }

    if (path === '/track/click' && request.method === 'POST') {
      return trackClick(request, env);
    }

    if (path === '/track/conversion' && request.method === 'POST') {
      return trackConversion(request, env);
    }

    if (path === '/admin/revenue' && request.method === 'GET') {
      return revenueReport(request, env);
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Cloudflare Workers scheduled event handler for OnJob cron import
  async scheduled(event, env, ctx) {
    try {
      const stats = await importOnJobFeed(env);
      console.log('OnJob import completed:', stats);
    } catch (error) {
      console.error('OnJob import failed:', error);
      throw error;
    }
  }
};
