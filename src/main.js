/* src/main.js - Entry point for CPA JOBS MVP
   Phase 2: Offer Engine - Add categories, offer CRUD, status management
   All handlers expect D1 and KV bindings injected by Cloudflare
*/

import { importOnJobFeed } from './importers/onjob.js';

// Static file contents embedded as base64 for Cloudflare Workers deployment
const STATIC_FILES = {
  'index.html': Buffer.from('PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+Q1BBIEpPQlMgLSBGaW5kIFlvdXIgTmV4dCBDUEEgT3Bwb3J0dW5pdHk8L3RpdGxlPgogIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iY3NzL3N0eWxlLmNzcyI+CiAgPGJhc2UgaHJlZj0iLyI+CjwvaGVhZD4KPGJvZHk+CiAgPGhlYWRlcj4KICAgIDxuYXYgY2xhc3M9Im5hdiI+CiAgICAgIDxhIGhyZWY9IiNsYW5kaW5nIiBjbGFzcz0ibG9nbyI+Q1BBIEpPQlM8L2E+CiAgICAgIDxkaXYgY2xhc3M9Im5hdi1saW5rcyI+CiAgICAgICAgPGEgaHJlZj0iI2xhbmRpbmciPkhvbWU8L2E+CiAgICAgICAgPGEgaHJlZj0iI2NhdGVnb3JpZXMiPkNhdGVnb3JpZXM8L2E+CiAgICAgIDwvZGl2PgogICAgPC9uYXY+CiAgPC9oZWFkZXI+CgogIDxtYWluIGlkPSJhcHAiPgogICAgPCEtLSBDb250ZW50IHdpbGwgYmUgbG9hZGVkIGhlcmUgLS0+CiAgPC9tYWluPgoKICA8Zm9vdGVyPgogICAgPHA+JmNvcHk7IDIwMjQgQ1BBIEpPQlMuIFlvdXIgZ2F0ZXdheSB0byBDUEEgb3Bwb3J0dW5pdGllcy48L3A+CiAgPC9mb290ZXI+CgogIDxzY3JpcHQgc3JjPSJqcy9hcHAuanMiPjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4=', 'base64').toString('utf8'),
  'js/app.js': Buffer.from('Ly8gYXBwLmpzIC0gQ1BBIEpPQlMgRnJvbnRlbmQgTVZQDQoNCmNsYXNzIENQQUpvYnNBcHAgew0KICBjb25zdHJ1Y3RvcigpIHsNCiAgICB0aGlzLnN0YXRlID0gew0KICAgICAgY3VycmVudFZpZXc6ICdsYW5kaW5nJywNCiAgICAgIGNhdGVnb3JpZXM6IFtdLA0KICAgICAgb2ZmZXJzOiBbXSwNCiAgICAgIHNlbGVjdGVkQ2F0ZWdvcnk6IG51bGwsDQogICAgICBsb2FkaW5nOiBmYWxzZSwNCiAgICAgIGVycm9yOiBudWxsLA0KICAgICAgc2VsZWN0ZWRPZmZlcjogbnVsbCwNCiAgICAgIHRyYWNraW5nRGF0YTogbnVsbA0KICAgIH07DQogICAgdGhpcy5iYXNlVXJsID0gJy8nOw0KICAgIHRoaXMuaW5pdCgpOw0KICB9DQoNCiAgaW5pdCgpIHsNCiAgICAvLyBDaGVjayBVUkwgaGFzaCBmb3IgbmF2aWdhdGlvbg0KICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgKCkgPT4gdGhpcy5oYW5kbGVSb3V0ZSgpKTsNCiAgICAvLyBJbml0aWFsIHJvdXRlIG9uIGxvYWQNCiAgICB0aGlzLmhhbmRsZVJvdXRlKCk7DQogIH0NCg0KICBhc3luYyBoYW5kbGVSb3V0ZSgpIHsNCiAgICBjb25zdCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoMSkgfHwgJ2xhbmRpbmcnOw0KICAgIHRoaXMuc3RhdGUuY3VycmVudFZpZXcgPSBoYXNoOw0KDQogICAgc3dpdGNoIChoYXNoKSB7DQogICAgICBjYXNlICdsYW5kaW5nJzoNCiAgICAgICAgYXdhaXQgdGhpcy5sb2FkTGFuZGluZygpOw0KICAgICAgICBicmVhazsNCiAgICAgIGNhc2UgJ2NhdGVnb3JpZXMnOg0KICAgICAgICBhd2FpdCB0aGlzLmxvYWRDYXRlZ29yaWVzKCk7DQogICAgICAgIGJyZWFrOw0KICAgICAgY2FzZSAnb2ZmZXItZGV0YWlsJzoNCiAgICAgICAgdGhpcy5sb2FkT2ZmZXJEZXRhaWwoKTsNCiAgICAgICAgYnJlYWs7DQogICAgICBjYXNlICdhZG1pbic6DQogICAgICAgIHRoaXMubG9hZEFkbWluKCk7DQogICAgICAgIGJyZWFrOw0KICAgICAgZGVmYXVsdDoNCiAgICAgICAgYXdhaXQgdGhpcy5sb2FkTGFuZGluZygpOw0KICAgIH0NCg0KICAgIHRoaXMucmVuZGVyKCk7DQogIH0NCg0KICBhc3luYyBsb2FkTGFuZGluZygpIHsNCiAgICB0cnkgew0KICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpOw0KICAgICAgdGhpcy5zdGF0ZS5lcnJvciA9IG51bGw7DQoNCiAgICAgIC8vIExvYWQgZmVhdHVyZWQgb2ZmZXJzDQogICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL29mZmVycycsIHsgc3RhdHVzOiAnYWN0aXZlJywgbGltaXQ6IDYgfSk7DQogICAgICBpZiAocmVzcG9uc2Uub2spIHsNCiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsNCiAgICAgICAgdGhpcy5zdGF0ZS5vZmZlcnMgPSBkYXRhLm9mZmVycyB8fCBbXTsNCiAgICAgIH0NCg0KICAgICAgLy8gTG9hZCBjYXRlZ29yaWVzIGZvciBuYXZpZ2F0aW9uDQogICAgICBjb25zdCBjYXRlZ29yaWVzUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmFwaUNhbGwoJy9jYXRlZ29yaWVzJyk7DQogICAgICBpZiAoY2F0ZWdvcmllc1Jlc3BvbnNlLm9rKSB7DQogICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjYXRlZ29yaWVzUmVzcG9uc2UuanNvbigpOw0KICAgICAgICB0aGlzLnN0YXRlLmNhdGVnb3JpZXMgPSBkYXRhLmNhdGVnb3JpZXMgfHwgW107DQogICAgICB9DQoNCiAgICB9IGNhdGNoIChlcnJvcikgew0KICAgICAgdGhpcy5zdGF0ZS5lcnJvciA9ICdGYWlsZWQgdG8gbG9hZCBsYW5kaW5nIHBhZ2UgZGF0YSc7DQogICAgICBjb25zb2xlLmVycm9yKCdMYW5kaW5nIGxvYWQgZXJyb3I6JywgZXJyb3IpOw0KICAgIH0gZmluYWxseSB7DQogICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpOw0KICAgIH0NCiAgfQ0KDQogIGFzeW5jIGxvYWRDYXRlZ29yaWVzKCkgew0KICAgIHRyeSB7DQogICAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7DQogICAgICB0aGlzLnN0YXRlLmVycm9yID0gbnVsbDsNCg0KICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmFwaUNhbGwoJy9jYXRlZ29yaWVzJyk7DQogICAgICBpZiAocmVzcG9uc2Uub2spIHsNCiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsNCiAgICAgICAgdGhpcy5zdGF0ZS5jYXRlZ29yaWVzID0gZGF0YS5jYXRlZ29yaWVzIHx8IFtdOw0KICAgICAgfQ0KDQogICAgICAvLyBBbHNvIGxvYWQgb2ZmZXJzIGZvciBjYXRlZ29yeSBwYWdlDQogICAgICBjb25zdCBvZmZlcnNSZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL29mZmVycycsIHsgc3RhdHVzOiAnYWN0aXZlJywgbGltaXQ6IDIwIH0pOw0KICAgICAgaWYgKG9mZmVyc1Jlc3BvbnNlLm9rKSB7DQogICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBvZmZlcnNSZXNwb25zZS5qc29uKCk7DQogICAgICAgIHRoaXMuc3RhdGUub2ZmZXJzID0gZGF0YS5vZmZlcnMgfHwgW107DQogICAgICB9DQoNCiAgICB9IGNhdGNoIChlcnJvcikgew0KICAgICAgdGhpcy5zdGF0ZS5lcnJvciA9ICdGYWlsZWQgdG8gbG9hZCBjYXRlZ29yaWVzJzsNCiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NhdGVnb3JpZXMgbG9hZCBlcnJvcjonLCBlcnJvcik7DQogICAgfSBmaW5hbGx5IHsNCiAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7DQogICAgfQ0KICB9DQoNCiAgbG9hZE9mZmVyRGV0YWlsKCkgew0KICAgIGNvbnN0IHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7DQogICAgY29uc3Qgb2ZmZXJJZCA9IHVybFBhcmFtcy5nZXQoJ2lkJyk7DQoNCiAgICBpZiAoIW9mZmVySWQpIHsNCiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSAnT2ZmZXIgSUQgbm90IGZvdW5kJzsNCiAgICAgIHRoaXMubmF2aWdhdGUoJ2xhbmRpbmcnKTsNCiAgICAgIHJldHVybjsNCiAgICB9DQoNCiAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7DQogICAgdGhpcy5zdGF0ZS5lcnJvciA9IG51bGw7DQoNCiAgICAvLyBMb2FkIHNwZWNpZmljIG9mZmVyDQogICAgdGhpcy5hcGlDYWxsKGAvb2ZmZXJzLyR7b2ZmZXJJZH1gKQ0KICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gew0KICAgICAgICBpZiAocmVzcG9uc2Uub2spIHsNCiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpOw0KICAgICAgICB9IGVsc2Ugew0KICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT2ZmZXIgbm90IGZvdW5kJyk7DQogICAgICAgIH0NCiAgICAgIH0pDQogICAgICAudGhlbihkYXRhID0+IHsNCiAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZE9mZmVyID0gZGF0YTsNCiAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTsNCiAgICAgIH0pDQogICAgICAuY2F0Y2goZXJyb3IgPT4gew0KICAgICAgICB0aGlzLnN0YXRlLmVycm9yID0gJ0ZhaWxlZCB0byBsb2FkIG9mZmVyIGRldGFpbHMnOw0KICAgICAgICBjb25zb2xlLmVycm9yKCdPZmZlciBkZXRhaWwgZXJyb3I6JywgZXJyb3IpOw0KICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpOw0KICAgICAgfSk7DQogIH0NCg0KICBsb2FkQWRtaW4oKSB7DQogICAgLy8gQWRtaW4gdmlldyB1c2VzIGV4aXN0aW5nIGJhY2tlbmQgZW5kcG9pbnRzDQogICAgdGhpcy5zdGF0ZS5jdXJyZW50VmlldyA9ICdhZG1pbic7DQogICAgdGhpcy5yZW5kZXIoKTsNCiAgfQ0KDQogIGFzeW5jIHRyYWNrQ2xpY2sob2ZmZXJJZCwgdXNlckRhdGEgPSB7fSkgew0KICAgIHRyeSB7DQogICAgICBjb25zdCBwYXlsb2FkID0gew0KICAgICAgICBvZmZlcl9pZDogb2ZmZXJJZCwNCiAgICAgICAgaXBfYWRkcmVzczogdXNlckRhdGEuaXAgfHwgJ3Vua25vd24nLA0KICAgICAgICB1c2VyX2FnZW50OiB1c2VyRGF0YS51c2VyQWdlbnQgfHwgJycsDQogICAgICAgIHJlZmVycmVyOiB1c2VyRGF0YS5yZWZlcnJlciB8fCAnJywNCiAgICAgICAgbWV0YWRhdGE6IHVzZXJEYXRhLm1ldGFkYXRhIHx8IHt9DQogICAgICB9Ow0KDQogICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL3RyYWNrL2NsaWNrJywgJ1BPU1QnLCBwYXlsb2FkKTsNCiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7DQoNCiAgICAgIHJldHVybiB7DQogICAgICAgIHN1Y2Nlc3M6IHJlc3BvbnNlLm9rLA0KICAgICAgICBjbGlja0lkOiBkYXRhLmNsaWNrX2lkLA0KICAgICAgICBtZXNzYWdlOiBkYXRhLm1lc3NhZ2UsDQogICAgICAgIGVycm9yOiAhcmVzcG9uc2Uub2sgPyBkYXRhLmVycm9yIDogbnVsbA0KICAgICAgfTsNCg0KICAgIH0gY2F0Y2ggKGVycm9yKSB7DQogICAgICBjb25zb2xlLmVycm9yKCdDbGljayB0cmFja2luZyBlcnJvcjonLCBlcnJvcik7DQogICAgICByZXR1cm4gew0KICAgICAgICBzdWNjZXNzOiBmYWxzZSwNCiAgICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gdHJhY2sgY2xpY2snDQogICAgICB9Ow0KICAgIH0NCiAgfQ0KDQogIGFzeW5jIGFwaUNhbGwoZW5kcG9pbnQsIHBhcmFtcyA9IG51bGwsIGJvZHkgPSBudWxsKSB7DQogICAgLy8gSGFuZGxlIGJvdGggb2xkIHNpZ25hdHVyZSAobWV0aG9kIGFzIHN0cmluZykgYW5kIG5ldyBzaWduYXR1cmUgKHBhcmFtcyBhcyBvYmplY3QpDQogICAgbGV0IG1ldGhvZCA9ICdHRVQnOw0KICAgIGxldCBxdWVyeVBhcmFtcyA9IG51bGw7DQoNCiAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHsNCiAgICAgIC8vIE9sZCBzaWduYXR1cmU6IGFwaUNhbGwoZW5kcG9pbnQsIG1ldGhvZCwgYm9keSkNCiAgICAgIG1ldGhvZCA9IHBhcmFtczsNCiAgICAgIHF1ZXJ5UGFyYW1zID0gbnVsbDsNCiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdvYmplY3QnICYmIHBhcmFtcyAhPT0gbnVsbCAmJiBib2R5ID09PSBudWxsKSB7DQogICAgICAvLyBOZXcgc2lnbmF0dXJlOiBhcGlDYWxsKGVuZHBvaW50LCB7cGFyYW1zfSkNCiAgICAgIHF1ZXJ5UGFyYW1zID0gcGFyYW1zOw0KICAgICAgbWV0aG9kID0gJ0dFVCc7DQogICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYm9keSA9PT0gJ29iamVjdCcpIHsNCiAgICAgIC8vIE5ldyBzaWduYXR1cmU6IGFwaUNhbGwoZW5kcG9pbnQsIHBhcmFtcywgYm9keSkNCiAgICAgIHF1ZXJ5UGFyYW1zID0gcGFyYW1zOw0KICAgICAgbWV0aG9kID0gJ1BPU1QnOw0KICAgIH0NCg0KICAgIGxldCB1cmwgPSB0aGlzLmJhc2VVcmwgKyBlbmRwb2ludDsNCg0KICAgIC8vIEJ1aWxkIHF1ZXJ5IHN0cmluZyBpZiBwYXJhbXMgcHJvdmlkZWQNCiAgICBpZiAocXVlcnlQYXJhbXMgJiYgbWV0aG9kID09PSAnR0VUJykgew0KICAgICAgY29uc3Qgc2VhcmNoUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcygpOw0KICAgICAgT2JqZWN0LmtleXMocXVlcnlQYXJhbXMpLmZvckVhY2goa2V5ID0+IHsNCiAgICAgICAgaWYgKHF1ZXJ5UGFyYW1zW2tleV0gIT09IG51bGwgJiYgcXVlcnlQYXJhbXNba2V5XSAhPT0gdW5kZWZpbmVkKSB7DQogICAgICAgICAgc2VhcmNoUGFyYW1zLmFwcGVuZChrZXksIHF1ZXJ5UGFyYW1zW2tleV0pOw0KICAgICAgICB9DQogICAgICB9KTsNCiAgICAgIGlmIChzZWFyY2hQYXJhbXMudG9TdHJpbmcoKSkgew0KICAgICAgICB1cmwgKz0gJz8nICsgc2VhcmNoUGFyYW1zLnRvU3RyaW5nKCk7DQogICAgICB9DQogICAgfQ0KDQogICAgY29uc3Qgb3B0aW9ucyA9IHsNCiAgICAgIG1ldGhvZCwNCiAgICAgIGhlYWRlcnM6IHsNCiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJw0KICAgICAgfQ0KICAgIH07DQoNCiAgICBpZiAoYm9keSkgew0KICAgICAgb3B0aW9ucy5ib2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keSk7DQogICAgfQ0KDQogICAgdHJ5IHsNCiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCBvcHRpb25zKTsNCiAgICAgIHJldHVybiByZXNwb25zZTsNCiAgICB9IGNhdGNoIChlcnJvcikgew0KICAgICAgY29uc29sZS5lcnJvcignQVBJIGNhbGwgZXJyb3I6JywgZXJyb3IpOw0KICAgICAgdGhyb3cgZXJyb3I7DQogICAgfQ0KICB9DQoNCiAgc2V0TG9hZGluZyhpc0xvYWRpbmcpIHsNCiAgICB0aGlzLnN0YXRlLmxvYWRpbmcgPSBpc0xvYWRpbmc7DQogICAgdGhpcy5yZW5kZXIoKTsNCiAgfQ0KDQogIG5hdmlnYXRlKHBhdGgpIHsNCiAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IHBhdGg7DQogIH0NCg0KICBhdHRhY2hFdmVudExpc3RlbmVycygpIHsNCiAgICAvLyBQbGFjZWhvbGRlciBmb3IgZXZlbnQgbGlzdGVuZXJzIC0gZXZlbnRzIGhhbmRsZWQgdmlhIGlubGluZSBvbmNsaWNrIGluIHRlbXBsYXRlcw0KICB9DQoNCiAgcmVuZGVyKCkgew0KICAgIGNvbnN0IGFwcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKTsNCiAgICBpZiAoIWFwcCkgcmV0dXJuOw0KDQogICAgbGV0IGh0bWwgPSAnJzsNCg0KICAgIHN3aXRjaCAodGhpcy5zdGF0ZS5jdXJyZW50Vmlldykgew0KICAgICAgY2FzZSAnbGFuZGluZyc6DQogICAgICAgIGh0bWwgPSB0aGlzLnJlbmRlckxhbmRpbmcoKTsNCiAgICAgICAgYnJlYWs7DQogICAgICBjYXNlICdjYXRlZ29yaWVzJzoNCiAgICAgICAgaHRtbCA9IHRoaXMucmVuZGVyQ2F0ZWdvcmllcygpOw0KICAgICAgICBicmVhazsNCiAgICAgIGNhc2UgJ29mZmVyLWRldGFpbCc6DQogICAgICAgIGh0bWwgPSB0aGlzLnJlbmRlck9mZmVyRGV0YWlsKCk7DQogICAgICAgIGJyZWFrOw0KICAgICAgY2FzZSAnYWRtaW4nOg0KICAgICAgICBodG1sID0gdGhpcy5yZW5kZXJBZG1pbigpOw0KICAgICAgICBicmVhazsNCiAgICAgIGRlZmF1bHQ6DQogICAgICAgIGh0bWwgPSB0aGlzLnJlbmRlckxhbmRpbmcoKTsNCiAgICB9DQoNCiAgICBhcHAuaW5uZXJIVE1MID0gaHRtbDsNCiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKCk7DQogIH0NCg0KICByZW5kZXJMYW5kaW5nKCkgew0KICAgIHJldHVybiBgDQogICAgICA8c2VjdGlvbiBjbGFzcz0iaGVybyI+DQogICAgICAgIDxoMT5GaW5kIFlvdXIgTmV4dCBDUEEgT3Bwb3J0dW5pdHk8L2gxPg0KICAgICAgICA8cD5EaXNjb3ZlciBoaWdoLXBheWluZyBDUEEgcHJvZ3JhbXMgYW5kIHN0YXJ0IGVhcm5pbmcgdG9kYXk8L3A+DQogICAgICAgICR7dGhpcy5zdGF0ZS5sb2FkaW5nID8gJzxwPkxvYWRpbmcuLi48L3A+JyA6ICcnfQ0KICAgICAgICAke3RoaXMuc3RhdGUuZXJyb3IgPyBgPHAgY2xhc3M9ImVycm9yIj4ke3RoaXMuc3RhdGUuZXJyb3J9PC9wPmAgOiAnJ30NCiAgICAgIDwvc2VjdGlvbj4NCg0KICAgICAgPHNlY3Rpb24gY2xhc3M9Im9mZmVyLWxpc3QiPg0KICAgICAgICA8aDI+RmVhdHVyZWQgT3Bwb3J0dW5pdGllczwvaDI+DQogICAgICAgICR7dGhpcy5zdGF0ZS5vZmZlcnMubWFwKG9mZmVyID0+IHRoaXMucmVuZGVyT2ZmZXJDYXJkKG9mZmVyKSkuam9pbignJyl9DQogICAgICA8L3NlY3Rpb24+DQoNCiAgICAgIDxzZWN0aW9uIGNsYXNzPSJvZmZlci1saXN0Ij4NCiAgICAgICAgPGgyPkJyb3dzZSBDYXRlZ29yaWVzPC9oMj4NCiAgICAgICAgPGRpdiBjbGFzcz0iY2F0ZWdvcnktZ3JpZCI+DQogICAgICAgICAgJHt0aGlzLnN0YXRlLmNhdGVnb3JpZXMubWFwKGNhdCA9PiBgDQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yeS1jYXJkIiBvbmNsaWNrPSJhcHAubmF2aWdhdGUoJ2NhdGVnb3JpZXMnKSI+DQogICAgICAgICAgICAgIDxoMz4ke2NhdC5uYW1lfTwvaDM+DQogICAgICAgICAgICAgIDxwPiR7Y2F0LmRlc2NyaXB0aW9ufTwvcD4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIGApLmpvaW4oJycpfQ0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvc2VjdGlvbj4NCiAgICBgOw0KICB9DQoNCiAgcmVuZGVyQ2F0ZWdvcmllcygpIHsNCiAgICBjb25zdCBmaWx0ZXJlZE9mZmVycyA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRDYXRlZ29yeQ0KICAgICAgPyB0aGlzLnN0YXRlLm9mZmVycy5maWx0ZXIob2ZmZXIgPT4gb2ZmZXIuY2F0ZWdvcnk/LnNsdWcgPT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRDYXRlZ29yeSkNCiAgICAgIDogdGhpcy5zdGF0ZS5vZmZlcnM7DQoNCiAgICByZXR1cm4gYA0KICAgICAgPGRpdiBjbGFzcz0iY2F0ZWdvcmllcy1jb250YWluZXIiPg0KICAgICAgICA8aDI+Q2F0ZWdvcmllczwvaDI+DQogICAgICAgIDxkaXYgY2xhc3M9ImNhdGVnb3J5LWZpbHRlcnMiPg0KICAgICAgICAgIDxidXR0b24gY2xhc3M9ImNhdGVnb3J5LWZpbHRlciAkeyF0aGlzLnN0YXRlLnNlbGVjdGVkQ2F0ZWdvcnkgPyAnYWN0aXZlJyA6ICcnfSIgb25jbGljaz0iYXBwLnNldFNlbGVjdGVkQ2F0ZWdvcnkobnVsbCkiPg0KICAgICAgICAgICAgQWxsDQogICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgJHt0aGlzLnN0YXRlLmNhdGVnb3JpZXMubWFwKGNhdCA9PiBgDQogICAgICAgICAgICA8YnV0dG9uIGNsYXNzPSJjYXRlZ29yeS1maWx0ZXIgJHt0aGlzLnN0YXRlLnNlbGVjdGVkQ2F0ZWdvcnkgPT09IGNhdC5zbHVnID8gJ2FjdGl2ZScgOiAnJ30iIG9uY2xpY2s9ImFwcC5zZXRTZWxlY3RlZENhdGVnb3J5KCcke2NhdC5zbHVnfScpIj4NCiAgICAgICAgICAgICAgJHtjYXQubmFtZX0NCiAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgIGApLmpvaW4oJycpfQ0KICAgICAgICA8L2Rpdj4NCg0KICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1ncmlkIj4NCiAgICAgICAgICAke2ZpbHRlcmVkT2ZmZXJzLm1hcChvZmZlciA9PiB0aGlzLnJlbmRlck9mZmVyQ2FyZChvZmZlcikpLmpvaW4oJycpfQ0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KICAgIGA7DQogIH0NCg0KICByZW5kZXJPZmZlckRldGFpbCgpIHsNCiAgICBpZiAoIXRoaXMuc3RhdGUuc2VsZWN0ZWRPZmZlcikgew0KICAgICAgcmV0dXJuIGA8cD5PZmZlciBub3QgZm91bmQgb3IgbG9hZGluZy4uLjwvcD5gOw0KICAgIH0NCg0KICAgIGNvbnN0IG9mZmVyID0gdGhpcy5zdGF0ZS5zZWxlY3RlZE9mZmVyOw0KDQogICAgcmV0dXJuIGANCiAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLWRldGFpbCI+DQogICAgICAgIDxidXR0b24gb25jbGljaz0iYXBwLm5hdmlnYXRlKCdsYW5kaW5nJykiIGNsYXNzPSJiYWNrLWJ0biI+4oaQIEJhY2s8L2J1dHRvbj4NCg0KICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1kZXRhaWwtY2FyZCI+DQogICAgICAgICAgPGgxPiR7b2ZmZXIudGl0bGV9PC9oMT4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1tZXRhIj4NCiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJjYXRlZ29yeSI+JHtvZmZlci5jYXRlZ29yeT8ubmFtZSB8fCAnR2VuZXJhbCd9PC9zcGFuPg0KICAgICAgICAgICAgPHNwYW4gY2xhc3M9InN0YXR1cyI+JHtvZmZlci5zdGF0dXN9PC9zcGFuPg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItZGVzY3JpcHRpb24iPg0KICAgICAgICAgICAgPGgzPkRlc2NyaXB0aW9uPC9oMz4NCiAgICAgICAgICAgIDxwPiR7b2ZmZXIuZGVzY3JpcHRpb259PC9wPg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItaW5mbyI+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpbmZvLWl0ZW0iPg0KICAgICAgICAgICAgICA8c3Ryb25nPlBheW91dDo8L3N0cm9uZz4gJCR7b2ZmZXIucGF5b3V0fSAke29mZmVyLnBheW91dF90eXBlfQ0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpbmZvLWl0ZW0iPg0KICAgICAgICAgICAgICA8c3Ryb25nPkV4cGlyZXM6PC9zdHJvbmc+ICR7b2ZmZXIuZXhwaXJlc19hdCA/IG5ldyBEYXRlKG9mZmVyLmV4cGlyZXNfYXQpLnRvTG9jYWxlRGF0ZVN0cmluZygpIDogJ05vIGV4cGlyYXRpb24nfQ0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpbmZvLWl0ZW0iPg0KICAgICAgICAgICAgICA8c3Ryb25nPkNsaWNrczo8L3N0cm9uZz4gJHtvZmZlci5jbGlja19jb3VudCB8fCAwfQ0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJpbmZvLWl0ZW0iPg0KICAgICAgICAgICAgICA8c3Ryb25nPkNvbnZlcnNpb25zOjwvc3Ryb25nPiAke29mZmVyLmNvbnZlcnNpb25fY291bnQgfHwgMH0NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItcmVxdWlyZW1lbnRzIj4NCiAgICAgICAgICAgIDxoMz5SZXF1aXJlbWVudHM8L2gzPg0KICAgICAgICAgICAgPHVsPg0KICAgICAgICAgICAgICAke29mZmVyLnJlcXVpcmVtZW50cz8ubWFwKHJlcSA9PiBgPGxpPiR7cmVxfTwvbGk+YCkuam9pbignJykgfHwgJzxsaT5ObyBzcGVjaWZpYyByZXF1aXJlbWVudHM8L2xpPid9DQogICAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLWN0YSI+DQogICAgICAgICAgICA8YSBocmVmPSIke29mZmVyLnVybH0iIHRhcmdldD0iX2JsYW5rIiBjbGFzcz0iY3RhLWJ1dHRvbiIgb25jbGljaz0iYXBwLmhhbmRsZU9mZmVyQ2xpY2soJyR7b2ZmZXIuaWR9JykiPg0KICAgICAgICAgICAgICBBcHBseSBOb3cNCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KICAgIGA7DQogIH0NCg0KICByZW5kZXJBZG1pbigpIHsNCiAgICByZXR1cm4gYA0KICAgICAgPGRpdiBjbGFzcz0iYWRtaW4tcGFuZWwiPg0KICAgICAgICA8aDI+QWRtaW4gRGFzaGJvYXJkPC9oMj4NCiAgICAgICAgPHA+QWRtaW4gZnVuY3Rpb25hbGl0eSB1c2luZyBleGlzdGluZyBiYWNrZW5kIGVuZHBvaW50czwvcD4NCg0KICAgICAgICA8ZGl2IGNsYXNzPSJhZG1pbi1hY3Rpb25zIj4NCiAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9ImFwcC5uYXZpZ2F0ZSgnbGFuZGluZycpIiBjbGFzcz0iYWRtaW4tYnRuIj5CYWNrIHRvIFNpdGU8L2J1dHRvbj4NCiAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9ImFwcC5sb2FkT2ZmZXJzQWRtaW4oKSIgY2xhc3M9ImFkbWluLWJ0biI+TWFuYWdlIE9mZmVyczwvYnV0dG9uPg0KICAgICAgICAgIDxidXR0b24gb25jbGljaz0iYXBwLmxvYWRSZXZlbnVlQWRtaW4oKSIgY2xhc3M9ImFkbWluLWJ0biI+VmlldyBSZXZlbnVlPC9idXR0b24+DQogICAgICAgIDwvZGl2Pg0KDQogICAgICAgIDxkaXYgaWQ9ImFkbWluLWNvbnRlbnQiPg0KICAgICAgICAgIDxwPkFkbWluIGludGVyZmFjZSBjb21pbmcgc29vbi4uLjwvcD4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCiAgICBgOw0KICB9DQoNCiAgcmVuZGVyT2ZmZXJDYXJkKG9mZmVyKSB7DQogICAgcmV0dXJuIGANCiAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLWNhcmQiIG9uY2xpY2s9ImFwcC5uYXZpZ2F0ZSgnb2ZmZXItZGV0YWlsP2lkPSR7b2ZmZXIuaWR9JykiPg0KICAgICAgICA8aDM+JHtvZmZlci50aXRsZX08L2gzPg0KICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1tZXRhIj4NCiAgICAgICAgICA8c3BhbiBjbGFzcz0iY2F0ZWdvcnkiPiR7b2ZmZXIuY2F0ZWdvcnk/Lm5hbWUgfHwgJ0dlbmVyYWwnfTwvc3Bhbj4NCiAgICAgICAgICA8c3BhbiBjbGFzcz0ic3RhdHVzICR7b2ZmZXIuc3RhdHVzfSI+JHtvZmZlci5zdGF0dXN9PC9zcGFuPg0KICAgICAgICA8L2Rpdj4NCiAgICAgICAgPHAgY2xhc3M9ImRlc2NyaXB0aW9uIj4ke29mZmVyLmRlc2NyaXB0aW9ufTwvcD4NCiAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItZm9vdGVyIj4NCiAgICAgICAgICA8c3BhbiBjbGFzcz0icGF5b3V0Ij4kJHtvZmZlci5wYXlvdXR9ICR7b2ZmZXIucGF5b3V0X3R5cGV9PC9zcGFuPg0KICAgICAgICAgIDxzcGFuIGNsYXNzPSJzdGF0dXMgJHtvZmZlci5zdGF0dXN9Ij4ke29mZmVyLnN0YXR1c308L3NwYW4+DQogICAgICAgIDwvZGl2Pg0KICAgICAgPC9kaXY+DQogICAgYDsNCiAgfQ0KDQogIHNldFNlbGVjdGVkQ2F0ZWdvcnkoY2F0ZWdvcnkpIHsNCiAgICB0aGlzLnN0YXRlLnNlbGVjdGVkQ2F0ZWdvcnkgPSBjYXRlZ29yeTsNCiAgICB0aGlzLnJlbmRlcigpOw0KICB9DQoNCiAgYXN5bmMgaGFuZGxlT2ZmZXJDbGljayhvZmZlcklkKSB7DQogICAgY29uc3QgY2xpY2tEYXRhID0gew0KICAgICAgb2ZmZXJfaWQ6IG9mZmVySWQsDQogICAgICBpcF9hZGRyZXNzOiAndW5rbm93bicsDQogICAgICB1c2VyX2FnZW50OiBuYXZpZ2F0b3IudXNlckFnZW50LA0KICAgICAgcmVmZXJyZXI6IGRvY3VtZW50LnJlZmVycmVyLA0KICAgICAgbWV0YWRhdGE6IHsNCiAgICAgICAgc291cmNlOiAnZnJvbnRlbmRfbXZwJywNCiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkNCiAgICAgIH0NCiAgICB9Ow0KDQogICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy50cmFja0NsaWNrKG9mZmVySWQsIGNsaWNrRGF0YSk7DQoNCiAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHsNCiAgICAgIGNvbnNvbGUubG9nKCdDbGljayB0cmFja2VkIHN1Y2Nlc3NmdWxseTonLCByZXN1bHQpOw0KICAgICAgLy8gVGhlIGJhY2tlbmQgaGFuZGxlcyB0aGUgYWN0dWFsIHJlZGlyZWN0IHRvIHRoZSBDUEEgZGVzdGluYXRpb24NCiAgICAgIC8vIFdlIGp1c3QgbmVlZCB0byB0cmFjayB0aGUgY2xpY2sgYW5kIGxldCB0aGUgYmFja2VuZCBoYW5kbGUgdGhlIHJlZGlyZWN0DQogICAgICByZXR1cm4gdHJ1ZTsNCiAgICB9IGVsc2Ugew0KICAgICAgY29uc29sZS5lcnJvcignQ2xpY2sgdHJhY2tpbmcgZmFpbGVkOicsIHJlc3VsdC5lcnJvcik7DQogICAgICAvLyBTaG93IGVycm9yIHN0YXRlIGJ1dCBjb250aW51ZSBuYXZpZ2F0aW9uDQogICAgICB0aGlzLnN0YXRlLmVycm9yID0gcmVzdWx0LmVycm9yIHx8ICdUcmFja2luZyBmYWlsZWQnOw0KICAgICAgdGhpcy5yZW5kZXIoKTsNCiAgICAgIHJldHVybiBmYWxzZTsNCiAgICB9DQogIH0NCn0NCg0KLy8gSW5pdGlhbGl6ZSB0aGUgYXBwIHdoZW4gRE9NIGlzIHJlYWR5DQppZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7DQogIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7DQogICAgd2luZG93LmFwcCA9IG5ldyBDUEFKb2JzQXBwKCk7DQogIH0pOw0KfSBlbHNlIHsNCiAgd2luZG93LmFwcCA9IG5ldyBDUEFKb2JzQXBwKCk7DQp9', 'base64').toString('utf8'),
  'css/style.css': Buffer.from('Lyogc3RhdGljL2Nzcy9zdHlsZS5jc3MgLSBDUEEgSk9CUyBNVlAgU3R5bGVzDQogICBQaGFzZSAwOiBGb3VuZGF0aW9uIC0gQmFzaWMgc3R5bGluZyAqLw0KDQpib2R5IHsNCiAgZm9udC1mYW1pbHk6IHN5c3RlbS11aSwgLWFwcGxlLXN5c3RlbSwgc2Fucy1zZXJpZjsNCiAgbWFyZ2luOiAwOw0KICBwYWRkaW5nOiAwOw0KICBiYWNrZ3JvdW5kOiAjZmFmYWZhOw0KICBjb2xvcjogIzMzMzsNCn0NCg0KaGVhZGVyIHsNCiAgYmFja2dyb3VuZDogI2ZmZjsNCiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMGUwZTA7DQogIHBhZGRpbmc6IDFyZW0gMnJlbTsNCn0NCg0KLm5hdiB7DQogIG1heC13aWR0aDogMTIwMHB4Ow0KICBtYXJnaW46IDAgYXV0bzsNCiAgZGlzcGxheTogZmxleDsNCiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOw0KICBhbGlnbi1pdGVtczogY2VudGVyOw0KfQ0KDQoubG9nbyB7DQogIGZvbnQtc2l6ZTogMS41cmVtOw0KICBmb250LXdlaWdodDogYm9sZDsNCiAgY29sb3I6ICMwMDdhY2M7DQogIHRleHQtZGVjb3JhdGlvbjogbm9uZTsNCn0NCg0KLm5hdi1saW5rcyBhIHsNCiAgbWFyZ2luLWxlZnQ6IDFyZW07DQogIGNvbG9yOiAjMzMzOw0KICB0ZXh0LWRlY29yYXRpb246IG5vbmU7DQogIGZvbnQtc2l6ZTogMC45cmVtOw0KfQ0KDQouaGVybyB7DQogIG1heC13aWR0aDogMTIwMHB4Ow0KICBtYXJnaW46IDNyZW0gYXV0bzsNCiAgcGFkZGluZzogMnJlbTsNCiAgdGV4dC1hbGlnbjogY2VudGVyOw0KICBiYWNrZ3JvdW5kOiAjZmZmOw0KICBib3JkZXItcmFkaXVzOiA4cHg7DQogIGJveC1zaGFkb3c6IDAgMnB4IDRweCByZ2JhKDAsMCwwLDAuMSk7DQp9DQoNCi5oZXJvIGgxIHsNCiAgZm9udC1zaXplOiAycmVtOw0KICBtYXJnaW4tYm90dG9tOiAxcmVtOw0KfQ0KDQouaGVybyBwIHsNCiAgY29sb3I6ICM2NjY7DQogIG1hcmdpbi1ib3R0b206IDJyZW07DQp9DQoNCi5vZmZlci1saXN0IHsNCiAgbWF4LXdpZHRoOiAxMjAwcHg7DQogIG1hcmdpbjogMnJlbSBhdXRvOw0KfQ0KDQoub2ZmZXItY2FyZCB7DQogIGJhY2tncm91bmQ6ICNmZmY7DQogIGJvcmRlcjogMXB4IHNvbGlkICNlMGUwZTA7DQogIGJvcmRlci1yYWRpdXM6IDhweDsNCiAgcGFkZGluZzogMXJlbTsNCiAgbWFyZ2luLWJvdHRvbTogMXJlbTsNCn0NCg0KLm9mZmVyLWNhcmQgaDMgew0KICBtYXJnaW46IDAgMCAwLjVyZW0gMDsNCiAgZm9udC1zaXplOiAxLjFyZW07DQp9DQoNCi5vZmZlci1jYXJkIHAgew0KICBjb2xvcjogIzY2NjsNCiAgZm9udC1zaXplOiAwLjlyZW07DQogIG1hcmdpbjogMC4ycmVtIDA7DQp9DQoNCmZvb3RlciB7DQogIGJhY2tncm91bmQ6ICNmZmY7DQogIGJvcmRlci10b3A6IDFweCBzb2xpZCAjZTBlMGUwOw0KICBwYWRkaW5nOiAxcmVtIDJyZW07DQogIHRleHQtYWxpZ246IGNlbnRlcjsNCiAgZm9udC1zaXplOiAwLjhyZW07DQogIGNvbG9yOiAjODg4Ow0KfQ0K', 'base64').toString('utf8')
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
