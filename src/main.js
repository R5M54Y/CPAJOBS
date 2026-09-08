/* src/main.js - Entry point for CPA JOBS MVP
   Phase 2: Offer Engine - Add categories, offer CRUD, status management
   All handlers expect D1 and KV bindings injected by Cloudflare
*/

import { importOnJobFeed } from './importers/onjob.js';

// Static file contents embedded as base64 for Cloudflare Workers deployment
const STATIC_FILES = {
  'index.html': Buffer.from('PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+Q1BBIEpPQlMgLSBGaW5kIFlvdXIgTmV4dCBDUEEgT3Bwb3J0dW5pdHk8L3RpdGxlPgogIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iY3NzL3N0eWxlLmNzcyI+CiAgPGJhc2UgaHJlZj0iLyI+CjwvaGVhZD4KPGJvZHk+CiAgPGhlYWRlcj4KICAgIDxuYXYgY2xhc3M9Im5hdiI+CiAgICAgIDxhIGhyZWY9IiNsYW5kaW5nIiBjbGFzcz0ibG9nbyI+Q1BBIEpPQlM8L2E+CiAgICAgIDxkaXYgY2xhc3M9Im5hdi1saW5rcyI+CiAgICAgICAgPGEgaHJlZj0iI2xhbmRpbmciPkhvbWU8L2E+CiAgICAgICAgPGEgaHJlZj0iI2NhdGVnb3JpZXMiPkNhdGVnb3JpZXM8L2E+CiAgICAgIDwvZGl2PgogICAgPC9uYXY+CiAgPC9oZWFkZXI+CgogIDxtYWluIGlkPSJhcHAiPgogICAgPCEtLSBDb250ZW50IHdpbGwgYmUgbG9hZGVkIGhlcmUgLS0+CiAgPC9tYWluPgoKICA8Zm9vdGVyPgogICAgPHA+JmNvcHk7IDIwMjQgQ1BBIEpPQlMuIFlvdXIgZ2F0ZXdheSB0byBDUEEgb3Bwb3J0dW5pdGllcy48L3A+CiAgPC9mb290ZXI+CgogIDxzY3JpcHQgc3JjPSJqcy9hcHAuanMiPjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4=', 'base64').toString('utf8'),
  'js/app.js': Buffer.from('YXBwLmpzIC0gQ1BBIEpPQlMgRnJvbnRlbmQgTVZQCgpjbGFzcyBDUEFKb2JzQXBwIHsKICBjb25zdHJ1Y3RvcigpIHsKICAgIHRoaXMuc3RhdGUgPSB7CiAgICAgIGN1cnJlbnRWaWV3OiAnbGFuZGluZycsCiAgICAgIGNhdGVnb3JpZXM6IFtdLAogICAgICBvZmZlcnM6IFtdLAogICAgICBzZWxlY3RlZENhdGVnb3J5OiBudWxsLAogICAgICBsb2FkaW5nOiBmYWxzZSwKICAgICAgZXJyb3I6IG51bGwsCiAgICAgIHNlbGVjdGVkT2ZmZXI6IG51bGwsCiAgICAgIHRyYWNraW5nRGF0YTogbnVsbAogICAgfTsKICAgIHRoaXMuYmFzZVVybCA9ICcvJzsKICAgIHRoaXMuaW5pdCgpOwogIH0KCiAgaW5pdCgpIHsKICAgIC8vIENoZWNrIFVSTCBoYXNoIGZvciBuYXZpZ2F0aW9uCiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHRoaXMuaGFuZGxlUm91dGUoKSk7CiAgICAvLyBJbml0aWFsIHJvdXRlIG9uIGxvYWQKICAgIHRoaXMuaGFuZGxlUm91dGUoKTsKICB9CgogIGFzeW5jIGhhbmRsZVJvdXRlKCkgewogICAgY29uc3QgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnNsaWNlKDEpIHx8ICdsYW5kaW5nJzsKICAgIHRoaXMuc3RhdGUuY3VycmVudFZpZXcgPSBoYXNoOwoKICAgIHN3aXRjaCAoaGFzaCkgewogICAgICBjYXNlICdsYW5kaW5nJzoKICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYW5kaW5nKCk7CiAgICAgICAgYnJlYWs7CiAgICAgIGNhc2UgJ2NhdGVnb3JpZXMnOgogICAgICAgIGF3YWl0IHRoaXMubG9hZENhdGVnb3JpZXMoKTsKICAgICAgICBicmVhazsKICAgICAgY2FzZSAnb2ZmZXItZGV0YWlsJzoKICAgICAgICB0aGlzLmxvYWRPZmZlckRldGFpbCgpOwogICAgICAgIGJyZWFrOwogICAgICBjYXNlICdhZG1pbic6CiAgICAgICAgdGhpcy5sb2FkQWRtaW4oKTsKICAgICAgICBicmVhazsKICAgICAgZGVmYXVsdDoKICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYW5kaW5nKCk7CiAgICB9CgogICAgdGhpcy5yZW5kZXIoKTsKICB9CgogIGFzeW5jIGxvYWRMYW5kaW5nKCkgewogICAgdHJ5IHsKICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpOwogICAgICB0aGlzLnN0YXRlLmVycm9yID0gbnVsbDsKCiAgICAgIC8vIExvYWQgZmVhdHVyZWQgb2ZmZXJzCiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvb2ZmZXJzJywgeyBzdGF0dXM6ICdhY3RpdmUnLCBsaW1pdDogNiB9KTsKICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7CiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsKICAgICAgICB0aGlzLnN0YXRlLm9mZmVycyA9IGRhdGEub2ZmZXJzIHx8IFtdOwogICAgICB9CgogICAgICAvLyBMb2FkIGNhdGVnb3JpZXMgZm9yIG5hdmlnYXRpb24KICAgICAgY29uc3QgY2F0ZWdvcmllc1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvY2F0ZWdvcmllcycpOwogICAgICBpZiAoY2F0ZWdvcmllc1Jlc3BvbnNlLm9rKSB7CiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNhdGVnb3JpZXNSZXNwb25zZS5qc29uKCk7CiAgICAgICAgdGhpcy5zdGF0ZS5jYXRlZ29yaWVzID0gZGF0YS5jYXRlZ29yaWVzIHx8IFtdOwogICAgICB9CgoKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSAnRmFpbGVkIHRvIGxvYWQgbGFuZGluZyBwYWdlIGRhdGEnOwogICAgICBjb25zb2xlLmVycm9yKCdMYW5kaW5nIGxvYWQgZXJyb3I6JywgZXJyb3IpOwogICAgfSBmaW5hbGx5IHsKICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTsKICAgIH0KICB9CgogIGFzeW5jIGxvYWRDYXRlZ29yaWVzKCkgewogICAgdHJ5IHsKICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpOwogICAgICB0aGlzLnN0YXRlLmVycm9yID0gbnVsbDsKCiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvY2F0ZWdvcmllcycpOwogICAgICBpZiAocmVzcG9uc2Uub2spIHsKICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpOwogICAgICAgIHRoaXMuc3RhdGUuY2F0ZWdvcmllcyA9IGRhdGEuY2F0ZWdvcmllcyB8fCBbXTsKICAgICAgfQoKICAgICAgLy8gQWxzbyBsb2FkIG9mZmVycyBmb3IgY2F0ZWdvcnkgcGFnZQogICAgICBjb25zdCBvZmZlcnNSZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL29mZmVycycsIHsgc3RhdHVzOiAnYWN0aXZlJywgbGltaXQ6IDIwIH0pOwogICAgICBpZiAob2ZmZXJzUmVzcG9uc2Uub2spIHsKICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgb2ZmZXJzUmVzcG9uc2UuanNvbigpOwogICAgICAgIHRoaXMuc3RhdGUub2ZmZXJzID0gZGF0YS5vZmZlcnMgfHwgW107CiAgICAgIH0KICAKICAGIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSAnRmFpbGVkIHRvIGxvYWQgY2F0ZWdvcmllcyc7CiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NhdGVnb3JpZXMgbG9hZCBlcnJvcjonLCBlcnJvcik7CiAgICB9IGZpbmFsbHkgewogICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpOwogICAgfQogIH0KCiAgbG9hZE9mZmVyRGV0YWlsKCkgewogICAgY29uc3QgdXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTsKICAgIGNvbnN0IG9mZmVySWQgPSB1cmxQYXJhbXMuZ2V0KCdpZCcpOwoKICAgIGlmICghb2ZmZXJJZCkgewogICAgICB0aGlzLnN0YXRlLmVycm9yID0gJ09mZmVyIElEIG5vdCBmb3VuZCc7CiAgICAgIHRoaXMubmF2aWdhdGUoJ2xhbmRpbmcnKTsKICAgICAgcmV0dXJuOwogICAgfQoKICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTsKICAgIHRoaXMuc3RhdGUuZXJyb3IgPSBudWxsOwoKICAgIC8vIExvYWQgc3BlY2lmaWMgb2ZmZXIKICAgIHRoaXMuYXBpQ2FsbChgL29mZmVycy8ke29mZmVySWR9YCkKICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gewogICAgICAgIGlmIChyZXNwb25zZS5vaykgewogICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPZmZlciBub3QgZm91bmQnKTsKICAgICAgICB9CiAgICAgIH0pCiAgICAgIC50aGVuKGRhdGEgPT4gewogICAgICAgIHRoaXMuc3RhdGUuc2VsZWN0ZWRPZmZlciA9IGRhdGE7CiAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTsKICAgICAgfSkKICAgICAgLmNhdGNoKGVycm9yID0+IHsKICAgICAgICB0aGlzLnN0YXRlLmVycm9yID0gJ0ZhaWxlZCB0byBsb2FkIG9mZmVyIGRldGFpbHMnOwogICAgICAgIGNvbnNvbGUuZXJyb3IoJ09mZmVyIGRldGFpbCBlcnJvcjonLCBlcnJvcik7CiAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTsKICAgICAgfSk7CiAgfQoKICBsb2FkQWRtaW4oKSB7CiAgICAvLyBBZG1pbiB2aWV3IHVzZXMgZXhpc3RpbmcgYmFja2VuZCBlbmRwb2ludHMKICAgIHRoaXMuc3RhdGUuY3VycmVudFZpZXcgPSAnYWRtaW4nOwogICAgdGhpcy5yZW5kZXIoKTsKICB9CgogIGFzeW5jIHRyYWNrQ2xpY2sob2ZmZXJJZCwgdXNlckRhdGEgPSB7fSkgewogICAgdHJ5IHsKICAgICAgY29uc3QgcGF5bG9hZCA9IHsKICAgICAgICBvZmZlcl9pZDogb2ZmZXJJZCwKICAgICAgICBpcF9hZGRyZXNzOiB1c2VyRGF0YS5pcCB8fCAndW5rbm93bicsCiAgICAgICAgdXNlcl9hZ2VudDogdXNlckRhdGEudXNlckFnZW50IHx8ICcnLAogICAgICAgIHJlZmVycmVyOiB1c2VyRGF0YS5yZWZlcnJlciB8fCAnJywKICAgICAgICBtZXRhZGF0YTogdXNlckRhdGEubWV0YWRhdGEgfHwge30KICAGICJ9OwoKICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmFwaUNhbGwoJy90cmFjay9jbGljaycsICdQT1NUJywgcGF5bG9hZCk7CiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7CgogICAgICByZXR1cm4gewogICAgICAgIHN1Y2Nlc3M6IHJlc3BvbnNlLm9rLAogICAgICAgIGNsaWNrSWQ6IGRhdGEuY2xpY2tfaWQsCiAgICAgICAgbWVzc2FnZTogZGF0YS5tZXNzYWdlLAogICAgICAgIGVycm9yOiAhcmVzcG9uc2Uub2sgPyBkYXRhLmVycm9yIDogbnVsbAogICAgICB9OwoKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NsaWNrIHRyYWNraW5nIGVycm9yOicsIGVycm9yKTsKICAgICAgcmV0dXJuIHsKICAgICAgICBzdWNjZXNzOiBmYWxzZSwKICAgICAgICBlcnJvcjogJ0ZhaWxlZCB0byB0cmFjayBjbGljaycKICAgICAgfTsKICAgIH0KICB9CgogIGFzeW5jIGFwaUNhbGwoZW5kcG9pbnQsIHBhcmFtcyA9IG51bGwsIGJvZHkgPSBudWxsKSB7CiAgICAvLyBIYW5kbGUgYm90aCBvbGQgc2lnbmF0dXJlIChtZXRob2QgYXMgc3RyaW5nKSBhbmQgbmV3IHNpZ25hdHVyZSAocGFyYW1zIGFzIG9iamVjdCkKICAgIGxldCBtZXRob2QgPSAnR0VUJzsKICAgIGxldCBxdWVyeVBhcmFtcyA9IG51bGw7CgogICAgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdzdHJpbmcnKSB7CiAgICAgIC8vIE9sZCBzaWduYXR1cmU6IGFwaUNhbGwoZW5kcG9pbnQsIG1ldGhvZCwgYm9keSkKICAgICAgbWV0aG9kID0gcGFyYW1zOwogICAgICBxdWVyeVBhcmFtcyA9IG51bGw7CiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdvYmplY3QnICYmIHBhcmFtcyAhPT0gbnVsbCAmJiBib2R5ID09PSBudWxsKSB7CiAgICAgIC8vIE5ldyBzaWduYXR1cmU6IGFwaUNhbGwoZW5kcG9pbnQsIHtwYXJhbXN9KQogICAgICBxdWVyeVBhcmFtcyA9IHBhcmFtczsKICAgICAgbWV0aG9kID0gJ0dFVCc7CiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBib2R5ID09PSAnb2JqZWN0JykgewogICAgICAvLyBOZXcgc2lnbmF0dXJlOiBhcGlDYWxsKGVuZHBvaW50LCBwYXJhbXMsIGJvZHkpCiAgICAgIHF1ZXJ5UGFyYW1zID0gcGFyYW1zOwogICAgICBtZXRob2QgPSAnUE9TVCc7CiAgICB9CgogICAgbGV0IHVybCA9IHRoaXMuYmFzZVVybCArIGVuZHBvaW50OwoKICAgIC8vIEJ1aWxkIHF1ZXJ5IHN0cmluZyBpZiBwYXJhbXMgcHJvdmlkZWQKICAgIGlmIChxdWVyeVBhcmFtcyAmJiBtZXRob2QgPT09ICdHRVQnKSB7CiAgICAgIGNvbnN0IHNlYXJjaFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoKTsKICAgICAgT2JqZWN0LmtleXMocXVlcnlQYXJhbXMpLmZvckVhY2goa2V5ID0+IHsKICAgICAgICBpZiAocXVlcnlQYXJhbXNba2V5XSAhPT0gbnVsbCAmJiBxdWVyeVBhcmFtc1trZXldICE9PSB1bmRlZmluZWQpIHsKICAgICAgICAgIHNlYXJjaFBhcmFtcy5hcHBlbmQoa2V5LCBxdWVyeVBhcmFtc1trZXldKTsKICAgICAgICB9CiAgICAgIH0pOwogICAgICBpZiAoc2VhcmNoUGFyYW1zLnRvU3RyaW5nKCkpIHsKICAgICAgICB1cmwgKz0gJz8nICsgc2VhcmNoUGFyYW1zLnRvU3RyaW5nKCk7CiAgICAgIH0KICAGICAF}CgogICAgY29uc3Qgb3B0aW9ucyA9IHsKICAgICAgbWV0aG9kLAogICAgICBoZWFkZXJzOiB7CiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJwogICAgICB9CiAgICB9OwoKICAgIGlmIChib2R5KSB7CiAgICAgIG9wdGlvbnMuYm9keSA9IEpTT04uc3RyaW5naWZ5KGJvZHkpOwogICAgfQoKICAgIHRyeSB7CiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCBvcHRpb25zKTsKICAgICAgcmV0dXJuIHJlc3BvbnNlOwogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgY29uc29sZS5lcnJvcignQVBJIGNhbGwgZXJyb3I6JywgZXJyb3IpOwogICAgICB0aHJvdyBlcnJvcjsKICAgIH0KICB9CgogIHNldExvYWRpbmcoaXNMb2FkaW5nKSB7CiAgICB0aGlzLnN0YXRlLmxvYWRpbmcgPSBpc0xvYWRpbmc7CiAgICB0aGlzLnJlbmRlcigpOwogIH0KCiAgbmF2aWdhdGUocGF0aCkgewogICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBwYXRoOwogIH0KCiAgcmVuZGVyKCkgewogICAgY29uc3QgYXBwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpOwogICAgaWYgKCFhcHApIHJldHVybjsKCiAgICBsZXQgaHRtbCA9ICcnOwoKICAgIHN3aXRjaCAodGhpcy5zdGF0ZS5jdXJyZW50VmlldykgewogICAgICBjYXNlICdsYW5kaW5nJzoKICAgICAgICBodG1sID0gdGhpcy5yZW5kZXJMYW5kaW5nKCk7CiAgICAgICAgYnJlYWs7CiAgICAgIGNhc2UgJ2NhdGVnb3JpZXMnOgogICAgICAgIGh0bWwgPSB0aGlzLnJlbmRlckNhdGVnb3JpZXMoKTsKICAgICAgICBicmVhazsKICAgICAgY2FzZSAnb2ZmZXItZGV0YWlsJzoKICAgICAgICBodG1sID0gdGhpcy5yZW5kZXJPZmZlckRldGFpbCgpOwogICAgICAgIGJyZWFrOwogICAgICBjYXNlICdhZG1pbic6CiAgICAgICAgaHRtbCA9IHRoaXMucmVuZGVyQWRtaW4oKTsKICAgICAgICBicmVhazsKICAgICAgZGVmYXVsdDoKICAgICAgICBodG1sID0gdGhpcy5yZW5kZXJMYW5kaW5nKCk7CiAgICB9CgogICAgYXBwLmlubmVySFRNTCA9IGh0bWw7CiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKCk7CiAgfQoKICByZW5kZXJMYW5kaW5nKCkgewogICAgcmV0dXJuIGAKICAgICAgPHNlY3Rpb24gY2xhc3M9Imhlcm8iPgogICAgICAgIDxoMT5GaW5kIFlvdXIgTmV4dCBDUEEgT3Bwb3J0dW5pdHk8L2gxPgogICAgICAgIDxwPkRpc2NvdmVyIGhpZ2gtcGF5aW5nIENQQSBwcm9ncmFtcyBhbmQgc3RhcnQgZWFybmluZyB0b2RheTwvcD4KICAgICAgICAke3RoaXMuc3RhdGUubG9hZGluZyA/ICc8cD5Mb2FkaW5nLi4uPC9wPicgOiAnJ30KICAgICAgICAke3RoaXMuc3RhdGUuZXJyb3IgPyBgPHAgY2xhc3M9ImVycm9yIj4ke3RoaXMuc3RhdGUuZXJyb3J9PC9wPmAgOiAnJ30KICAgICAgPC9zZWN0aW9uPgoKICAgICAgPHNlY3Rpb24gY2xhc3M9Im9mZmVyLWxpc3QiPgogICAgICAgIDxoMj5GZWF0dXJlZCBPcHBvcnR1bml0aWVzPC9oMj4KICAgICAgICAke3RoaXMuc3RhdGUub2ZmZXJzLm1hcChvZmZlciA9PiB0aGlzLnJlbmRlck9mZmVyQ2FyZChvZmZlcikpLmpvaW4oJycpfQogICAgICA8L3NlY3Rpb24+CgogICAgICA8c2VjdGlvbiBjbGFzcz0ib2ZmZXItbGlzdCI+CiAgICAgICAgPGgyPkJyb3dzZSBDYXRlZ29yaWVzPC9oMj4KICAgICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yeS1ncmlkIj4KICAgICAgICAgICR7dGhpcy5zdGF0ZS5jYXRlZ29yaWVzLm1hcChjYXQgPT4gYAogICAgICAgICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yeS1jYXJkIiBvbmNsaWNrPSJhcHAubmF2aWdhdGUoJ2NhdGVnb3JpZXMnKSI+CiAgICAgICAgICAgICAgPGgzPiR7Y2F0Lm5hbWV9PC9oMz4KICAgICAgICAgICAgICA8cD4ke2NhdC5kZXNjcmlwdGlvbn08L3A+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgYCkuam9pbignJyl9CiAgICAgICAgPC9kaXY+CiAgICAgIDwvc2VjdGlvbj4KICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKK=', 'base64').toString('utf8'),
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
