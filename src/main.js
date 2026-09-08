/* src/main.js - Entry point for CPA JOBS MVP
   Phase 2: Offer Engine - Add categories, offer CRUD, status management
   All handlers expect D1 and KV bindings injected by Cloudflare
*/

import { importOnJobFeed } from './importers/onjob.js';

// Static file contents embedded as base64 for Cloudflare Workers deployment
const STATIC_FILES = {
  'index.html': Buffer.from('PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+Q1BBIEpPQlMgLSBGaW5kIFlvdXIgTmV4dCBDUEEgT3Bwb3J0dW5pdHk8L3RpdGxlPgogIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iY3NzL3N0eWxlLmNzcyI+CiAgPGJhc2UgaHJlZj0iLyI+CjwvaGVhZD4KPGJvZHk+CiAgPGhlYWRlcj4KICAgIDxuYXYgY2xhc3M9Im5hdiI+CiAgICAgIDxhIGhyZWY9IiNsYW5kaW5nIiBjbGFzcz0ibG9nbyI+Q1BBIEpPQlM8L2E+CiAgICAgIDxkaXYgY2xhc3M9Im5hdi1saW5rcyI+CiAgICAgICAgPGEgaHJlZj0iI2xhbmRpbmciPkhvbWU8L2E+CiAgICAgICAgPGEgaHJlZj0iI2NhdGVnb3JpZXMiPkNhdGVnb3JpZXM8L2E+CiAgICAgIDwvZGl2PgogICAgPC9uYXY+CiAgPC9oZWFkZXI+CgogIDxtYWluIGlkPSJhcHAiPgogICAgPCEtLSBDb250ZW50IHdpbGwgYmUgbG9hZGVkIGhlcmUgLS0+CiAgPC9tYWluPgoKICA8Zm9vdGVyPgogICAgPHA+JmNvcHk7IDIwMjQgQ1BBIEpPQlMuIFlvdXIgZ2F0ZXdheSB0byBDUEEgb3Bwb3J0dW5pdGllcy48L3A+CiAgPC9mb290ZXI+CgogIDxzY3JpcHQgc3JjPSJqcy9hcHAuanMiPjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4=', 'base64').toString('utf8'),
  'js/app.js': Buffer.from('Ly8gYXBwLmpzIC0gQ1BBIEpPQlMgRnJvbnRlbmQgTVZQDQoNCmNsYXNzIENQQUpvYnNBcHAgew0KICBjb25zdHJ1Y3RvcigpIHsNCiAgICB0aGlzLnN0YXRlID0gew0KICAgICAgY3VycmVudFZpZXc6ICdsYW5kaW5nJywNCiAgICAgIGNhdGVnb3JpZXM6IFtdLA0KICAgICAgb2ZmZXJzOiBbXSwNCiAgICAgIHNlbGVjdGVkQ2F0ZWdvcnk6IG51bGwsDQogICAgICBsb2FkaW5nOiBmYWxzZSwNCiAgICAgIGVycm9yOiBudWxsLA0KICAgICAgc2VsZWN0ZWRPZmZlcjogbnVsbCwNCiAgICAgIHRyYWNraW5nRGF0YTogbnVsbCwNCiAgICAgIHJvdXRlUGFyYW1zOiB7fQ0KICAgIH07DQogICAgdGhpcy5iYXNlVXJsID0gJyc7DQogICAgdGhpcy5pbml0KCk7DQogIH0NCg0KICBpbml0KCkgew0KICAgIC8vIENoZWNrIFVSTCBoYXNoIGZvciBuYXZpZ2F0aW9uDQogICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCAoKSA9PiB0aGlzLmhhbmRsZVJvdXRlKCkpOw0KICAgIC8vIEluaXRpYWwgcm91dGUgb24gbG9hZA0KICAgIHRoaXMuaGFuZGxlUm91dGUoKTsNCiAgfQ0KDQogIGFzeW5jIGhhbmRsZVJvdXRlKCkgew0KICAgIGNvbnN0IGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zbGljZSgxKSB8fCAnbGFuZGluZyc7DQogICAgDQogICAgLy8gUGFyc2Ugcm91dGUgbmFtZSBhbmQgcXVlcnkgcGFyYW1zIGZyb20gaGFzaA0KICAgIC8vIGUuZy4sICdvZmZlci1kZXRhaWw/aWQ9b25qb2ItbWFudWFsLTAwMScg4oaSIHJvdXRlPSdvZmZlci1kZXRhaWwnLCBwYXJhbXM9e2lkOiAnb25qb2ItbWFudWFsLTAwMSd9DQogICAgY29uc3QgW3JvdXRlTmFtZSwgcXVlcnlTdHJpbmddID0gaGFzaC5zcGxpdCgnPycpOw0KICAgIHRoaXMuc3RhdGUuY3VycmVudFZpZXcgPSByb3V0ZU5hbWU7DQogICAgDQogICAgLy8gU3RvcmUgcXVlcnkgcGFyYW1zIGluIHN0YXRlIGZvciByb3V0ZSBoYW5kbGVycyB0byB1c2UNCiAgICB0aGlzLnN0YXRlLnJvdXRlUGFyYW1zID0ge307DQogICAgaWYgKHF1ZXJ5U3RyaW5nKSB7DQogICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHF1ZXJ5U3RyaW5nKTsNCiAgICAgIHBhcmFtcy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7DQogICAgICAgIHRoaXMuc3RhdGUucm91dGVQYXJhbXNba2V5XSA9IHZhbHVlOw0KICAgICAgfSk7DQogICAgfQ0KDQogICAgc3dpdGNoIChyb3V0ZU5hbWUpIHsNCiAgICAgIGNhc2UgJ2xhbmRpbmcnOg0KICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYW5kaW5nKCk7DQogICAgICAgIGJyZWFrOw0KICAgICAgY2FzZSAnY2F0ZWdvcmllcyc6DQogICAgICAgIGF3YWl0IHRoaXMubG9hZENhdGVnb3JpZXMoKTsNCiAgICAgICAgYnJlYWs7DQogICAgICBjYXNlICdvZmZlci1kZXRhaWwnOg0KICAgICAgICBhd2FpdCB0aGlzLmxvYWRPZmZlckRldGFpbCgpOw0KICAgICAgICBicmVhazsNCiAgICAgIGNhc2UgJ2FkbWluJzoNCiAgICAgICAgdGhpcy5sb2FkQWRtaW4oKTsNCiAgICAgICAgYnJlYWs7DQogICAgICBkZWZhdWx0Og0KICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYW5kaW5nKCk7DQogICAgfQ0KDQogICAgdGhpcy5yZW5kZXIoKTsNCiAgfQ0KDQogIGFzeW5jIGxvYWRMYW5kaW5nKCkgew0KICAgIHRyeSB7DQogICAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7DQogICAgICB0aGlzLnN0YXRlLmVycm9yID0gbnVsbDsNCg0KICAgICAgLy8gTG9hZCBmZWF0dXJlZCBvZmZlcnMNCiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvb2ZmZXJzJywgeyBzdGF0dXM6ICdhY3RpdmUnLCBsaW1pdDogNiB9KTsNCiAgICAgIGlmIChyZXNwb25zZS5vaykgew0KICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpOw0KICAgICAgICB0aGlzLnN0YXRlLm9mZmVycyA9IGRhdGEub2ZmZXJzIHx8IFtdOw0KICAgICAgfQ0KDQogICAgICAvLyBMb2FkIGNhdGVnb3JpZXMgZm9yIG5hdmlnYXRpb24NCiAgICAgIGNvbnN0IGNhdGVnb3JpZXNSZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL2NhdGVnb3JpZXMnKTsNCiAgICAgIGlmIChjYXRlZ29yaWVzUmVzcG9uc2Uub2spIHsNCiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNhdGVnb3JpZXNSZXNwb25zZS5qc29uKCk7DQogICAgICAgIHRoaXMuc3RhdGUuY2F0ZWdvcmllcyA9IGRhdGEuY2F0ZWdvcmllcyB8fCBbXTsNCiAgICAgIH0NCg0KICAgIH0gY2F0Y2ggKGVycm9yKSB7DQogICAgICB0aGlzLnN0YXRlLmVycm9yID0gJ0ZhaWxlZCB0byBsb2FkIGxhbmRpbmcgcGFnZSBkYXRhJzsNCiAgICAgIGNvbnNvbGUuZXJyb3IoJ0xhbmRpbmcgbG9hZCBlcnJvcjonLCBlcnJvcik7DQogICAgfSBmaW5hbGx5IHsNCiAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7DQogICAgfQ0KICB9DQoNCiAgYXN5bmMgbG9hZENhdGVnb3JpZXMoKSB7DQogICAgdHJ5IHsNCiAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTsNCiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSBudWxsOw0KDQogICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL2NhdGVnb3JpZXMnKTsNCiAgICAgIGlmIChyZXNwb25zZS5vaykgew0KICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpOw0KICAgICAgICB0aGlzLnN0YXRlLmNhdGVnb3JpZXMgPSBkYXRhLmNhdGVnb3JpZXMgfHwgW107DQogICAgICB9DQoNCiAgICAgIC8vIEFsc28gbG9hZCBvZmZlcnMgZm9yIGNhdGVnb3J5IHBhZ2UNCiAgICAgIGNvbnN0IG9mZmVyc1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvb2ZmZXJzJywgeyBzdGF0dXM6ICdhY3RpdmUnLCBsaW1pdDogMjAgfSk7DQogICAgICBpZiAob2ZmZXJzUmVzcG9uc2Uub2spIHsNCiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IG9mZmVyc1Jlc3BvbnNlLmpzb24oKTsNCiAgICAgICAgdGhpcy5zdGF0ZS5vZmZlcnMgPSBkYXRhLm9mZmVycyB8fCBbXTsNCiAgICAgIH0NCg0KICAgIH0gY2F0Y2ggKGVycm9yKSB7DQogICAgICB0aGlzLnN0YXRlLmVycm9yID0gJ0ZhaWxlZCB0byBsb2FkIGNhdGVnb3JpZXMnOw0KICAgICAgY29uc29sZS5lcnJvcignQ2F0ZWdvcmllcyBsb2FkIGVycm9yOicsIGVycm9yKTsNCiAgICB9IGZpbmFsbHkgew0KICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTsNCiAgICB9DQogIH0NCg0KICBhc3luYyBsb2FkT2ZmZXJEZXRhaWwoKSB7DQogICAgY29uc3Qgb2ZmZXJJZCA9IHRoaXMuc3RhdGUucm91dGVQYXJhbXM/LmlkOw0KDQogICAgaWYgKCFvZmZlcklkKSB7DQogICAgICB0aGlzLnN0YXRlLmVycm9yID0gJ09mZmVyIElEIG5vdCBmb3VuZCc7DQogICAgICB0aGlzLm5hdmlnYXRlKCdsYW5kaW5nJyk7DQogICAgICByZXR1cm47DQogICAgfQ0KDQogICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpOw0KICAgIHRoaXMuc3RhdGUuZXJyb3IgPSBudWxsOw0KDQogICAgLy8gTG9hZCBzcGVjaWZpYyBvZmZlcg0KICAgIHRyeSB7DQogICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbChgL29mZmVycy8ke29mZmVySWR9YCk7DQogICAgICBpZiAocmVzcG9uc2Uub2spIHsNCiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsNCiAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZE9mZmVyID0gZGF0YTsNCiAgICAgIH0gZWxzZSB7DQogICAgICAgIHRocm93IG5ldyBFcnJvcignT2ZmZXIgbm90IGZvdW5kJyk7DQogICAgICB9DQogICAgfSBjYXRjaCAoZXJyb3IpIHsNCiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSAnRmFpbGVkIHRvIGxvYWQgb2ZmZXIgZGV0YWlscyc7DQogICAgICBjb25zb2xlLmVycm9yKCdPZmZlciBkZXRhaWwgZXJyb3I6JywgZXJyb3IpOw0KICAgIH0gZmluYWxseSB7DQogICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpOw0KICAgICAgdGhpcy5yZW5kZXIoKTsNCiAgICB9DQogIH0NCg0KICBsb2FkQWRtaW4oKSB7DQogICAgLy8gQWRtaW4gdmlldyB1c2VzIGV4aXN0aW5nIGJhY2tlbmQgZW5kcG9pbnRzDQogICAgdGhpcy5zdGF0ZS5jdXJyZW50VmlldyA9ICdhZG1pbic7DQogICAgdGhpcy5yZW5kZXIoKTsNCiAgfQ0KDQogIGFzeW5jIHRyYWNrQ2xpY2sob2ZmZXJJZCwgdXNlckRhdGEgPSB7fSkgew0KICAgIHRyeSB7DQogICAgICBjb25zdCBwYXlsb2FkID0gew0KICAgICAgICBvZmZlcl9pZDogb2ZmZXJJZCwNCiAgICAgICAgaXBfYWRkcmVzczogdXNlckRhdGEuaXAgfHwgJ3Vua25vd24nLA0KICAgICAgICB1c2VyX2FnZW50OiB1c2VyRGF0YS51c2VyQWdlbnQgfHwgJycsDQogICAgICAgIHJlZmVycmVyOiB1c2VyRGF0YS5yZWZlcnJlciB8fCAnJywNCiAgICAgICAgbWV0YWRhdGE6IHVzZXJEYXRhLm1ldGFkYXRhIHx8IHt9DQogICAgICB9Ow0KDQogICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL3RyYWNrL2NsaWNrJywgJ1BPU1QnLCBwYXlsb2FkKTsNCiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7DQoNCiAgICAgIHJldHVybiB7DQogICAgICAgIHN1Y2Nlc3M6IHJlc3BvbnNlLm9rLA0KICAgICAgICBjbGlja0lkOiBkYXRhLmNsaWNrX2lkLA0KICAgICAgICBtZXNzYWdlOiBkYXRhLm1lc3NhZ2UsDQogICAgICAgIGVycm9yOiAhcmVzcG9uc2Uub2sgPyBkYXRhLmVycm9yIDogbnVsbA0KICAgICAgfTsNCg0KICAgIH0gY2F0Y2ggKGVycm9yKSB7DQogICAgICBjb25zb2xlLmVycm9yKCdDbGljayB0cmFja2luZyBlcnJvcjonLCBlcnJvcik7DQogICAgICByZXR1cm4gew0KICAgICAgICBzdWNjZXNzOiBmYWxzZSwNCiAgICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gdHJhY2sgY2xpY2snDQogICAgICB9Ow0KICAgIH0NCiAgfQ0KDQogIGFzeW5jIGFwaUNhbGwoZW5kcG9pbnQsIHBhcmFtcyA9IG51bGwsIGJvZHkgPSBudWxsKSB7DQogICAgLy8gSGFuZGxlIGJvdGggb2xkIHNpZ25hdHVyZSAobWV0aG9kIGFzIHN0cmluZykgYW5kIG5ldyBzaWduYXR1cmUgKHBhcmFtcyBhcyBvYmplY3QpDQogICAgbGV0IG1ldGhvZCA9ICdHRVQnOw0KICAgIGxldCBxdWVyeVBhcmFtcyA9IG51bGw7DQoNCiAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHsNCiAgICAgIC8vIE9sZCBzaWduYXR1cmU6IGFwaUNhbGwoZW5kcG9pbnQsIG1ldGhvZCwgYm9keSkNCiAgICAgIG1ldGhvZCA9IHBhcmFtczsNCiAgICAgIHF1ZXJ5UGFyYW1zID0gbnVsbDsNCiAgICB9IGVsc2UgaWYgKHBhcmFtcyAhPT0gbnVsbCAmJiB0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyAmJiBib2R5ID09PSBudWxsKSB7DQogICAgICAvLyBOZXcgc2lnbmF0dXJlOiBhcGlDYWxsKGVuZHBvaW50LCB7cGFyYW1zfSkNCiAgICAgIHF1ZXJ5UGFyYW1zID0gcGFyYW1zOw0KICAgICAgbWV0aG9kID0gJ0dFVCc7DQogICAgfSBlbHNlIGlmIChwYXJhbXMgIT09IG51bGwgJiYgYm9keSAhPT0gbnVsbCkgew0KICAgICAgLy8gTmV3IHNpZ25hdHVyZTogYXBpQ2FsbChlbmRwb2ludCwgcGFyYW1zLCBib2R5KQ0KICAgICAgcXVlcnlQYXJhbXMgPSBwYXJhbXM7DQogICAgICBtZXRob2QgPSAnUE9TVCc7DQogICAgfQ0KDQogICAgbGV0IHVybCA9IHRoaXMuYmFzZVVybCArIGVuZHBvaW50Ow0KDQogICAgLy8gQnVpbGQgcXVlcnkgc3RyaW5nIGlmIHBhcmFtcyBwcm92aWRlZA0KICAgIGlmIChxdWVyeVBhcmFtcyAmJiBtZXRob2QgPT09ICdHRVQnKSB7DQogICAgICBjb25zdCBzZWFyY2hQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKCk7DQogICAgICBPYmplY3Qua2V5cyhxdWVyeVBhcmFtcykuZm9yRWFjaChrZXkgPT4gew0KICAgICAgICBpZiAocXVlcnlQYXJhbXNba2V5XSAhPT0gbnVsbCAmJiBxdWVyeVBhcmFtc1trZXldICE9PSB1bmRlZmluZWQpIHsNCiAgICAgICAgICBzZWFyY2hQYXJhbXMuYXBwZW5kKGtleSwgcXVlcnlQYXJhbXNba2V5XSk7DQogICAgICAgIH0NCiAgICAgIH0pOw0KICAgICAgaWYgKHNlYXJjaFBhcmFtcy50b1N0cmluZygpKSB7DQogICAgICAgIHVybCArPSAnPycgKyBzZWFyY2hQYXJhbXMudG9TdHJpbmcoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBjb25zdCBvcHRpb25zID0gew0KICAgICAgbWV0aG9kLA0KICAgICAgaGVhZGVyczogew0KICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nDQogICAgICB9DQogICAgfTsNCg0KICAgIGlmIChib2R5KSB7DQogICAgICBvcHRpb25zLmJvZHkgPSBKU09OLnN0cmluZ2lmeShib2R5KTsNCiAgICB9DQoNCiAgICB0cnkgew0KICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIG9wdGlvbnMpOw0KICAgICAgcmV0dXJuIHJlc3BvbnNlOw0KICAgIH0gY2F0Y2ggKGVycm9yKSB7DQogICAgICBjb25zb2xlLmVycm9yKCdBUEkgY2FsbCBlcnJvcjonLCBlcnJvcik7DQogICAgICB0aHJvdyBlcnJvcjsNCiAgICB9DQogIH0NCg0KICBzZXRMb2FkaW5nKGlzTG9hZGluZykgew0KICAgIHRoaXMuc3RhdGUubG9hZGluZyA9IGlzTG9hZGluZzsNCiAgICB0aGlzLnJlbmRlcigpOw0KICB9DQoNCiAgbmF2aWdhdGUocGF0aCkgew0KICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gcGF0aDsNCiAgfQ0KDQogIGF0dGFjaEV2ZW50TGlzdGVuZXJzKCkgew0KICAgIC8vIFBsYWNlaG9sZGVyIGZvciBldmVudCBsaXN0ZW5lcnMgLSBldmVudHMgaGFuZGxlZCB2aWEgaW5saW5lIG9uY2xpY2sgaW4gdGVtcGxhdGVzDQogIH0NCg0KICByZW5kZXIoKSB7DQogICAgY29uc3QgYXBwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpOw0KICAgIGlmICghYXBwKSByZXR1cm47DQoNCiAgICBsZXQgaHRtbCA9ICcnOw0KDQogICAgc3dpdGNoICh0aGlzLnN0YXRlLmN1cnJlbnRWaWV3KSB7DQogICAgICBjYXNlICdsYW5kaW5nJzoNCiAgICAgICAgaHRtbCA9IHRoaXMucmVuZGVyTGFuZGluZygpOw0KICAgICAgICBicmVhazsNCiAgICAgIGNhc2UgJ2NhdGVnb3JpZXMnOg0KICAgICAgICBodG1sID0gdGhpcy5yZW5kZXJDYXRlZ29yaWVzKCk7DQogICAgICAgIGJyZWFrOw0KICAgICAgY2FzZSAnb2ZmZXItZGV0YWlsJzoNCiAgICAgICAgaHRtbCA9IHRoaXMucmVuZGVyT2ZmZXJEZXRhaWwoKTsNCiAgICAgICAgYnJlYWs7DQogICAgICBjYXNlICdhZG1pbic6DQogICAgICAgIGh0bWwgPSB0aGlzLnJlbmRlckFkbWluKCk7DQogICAgICAgIGJyZWFrOw0KICAgICAgZGVmYXVsdDoNCiAgICAgICAgaHRtbCA9IHRoaXMucmVuZGVyTGFuZGluZygpOw0KICAgIH0NCg0KICAgIGFwcC5pbm5lckhUTUwgPSBodG1sOw0KICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoKTsNCiAgfQ0KDQogIHJlbmRlckxhbmRpbmcoKSB7DQogICAgcmV0dXJuIGANCiAgICAgIDxzZWN0aW9uIGNsYXNzPSJoZXJvIj4NCiAgICAgICAgPGgxPkZpbmQgWW91ciBOZXh0IENQQSBPcHBvcnR1bml0eTwvaDE+DQogICAgICAgIDxwPkRpc2NvdmVyIGhpZ2gtcGF5aW5nIENQQSBwcm9ncmFtcyBhbmQgc3RhcnQgZWFybmluZyB0b2RheTwvcD4NCiAgICAgICAgJHt0aGlzLnN0YXRlLmxvYWRpbmcgPyAnPHA+TG9hZGluZy4uLjwvcD4nIDogJyd9DQogICAgICAgICR7dGhpcy5zdGF0ZS5lcnJvciA/IGA8cCBjbGFzcz0iZXJyb3IiPiR7dGhpcy5zdGF0ZS5lcnJvcn08L3A+YCA6ICcnfQ0KICAgICAgPC9zZWN0aW9uPg0KDQogICAgICA8c2VjdGlvbiBjbGFzcz0ib2ZmZXItbGlzdCI+DQogICAgICAgIDxoMj5GZWF0dXJlZCBPcHBvcnR1bml0aWVzPC9oMj4NCiAgICAgICAgJHt0aGlzLnN0YXRlLm9mZmVycy5tYXAob2ZmZXIgPT4gdGhpcy5yZW5kZXJPZmZlckNhcmQob2ZmZXIpKS5qb2luKCcnKX0NCiAgICAgIDwvc2VjdGlvbj4NCg0KICAgICAgPHNlY3Rpb24gY2xhc3M9Im9mZmVyLWxpc3QiPg0KICAgICAgICA8aDI+QnJvd3NlIENhdGVnb3JpZXM8L2gyPg0KICAgICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yeS1ncmlkIj4NCiAgICAgICAgICAke3RoaXMuc3RhdGUuY2F0ZWdvcmllcy5tYXAoY2F0ID0+IGANCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImNhdGVnb3J5LWNhcmQiIG9uY2xpY2s9ImFwcC5uYXZpZ2F0ZSgnY2F0ZWdvcmllcycpIj4NCiAgICAgICAgICAgICAgPGgzPiR7Y2F0Lm5hbWV9PC9oMz4NCiAgICAgICAgICAgICAgPHA+JHtjYXQuZGVzY3JpcHRpb259PC9wPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgYCkuam9pbignJyl9DQogICAgICAgIDwvZGl2Pg0KICAgICAgPC9zZWN0aW9uPg0KICAgIGA7DQogIH0NCg0KICByZW5kZXJDYXRlZ29yaWVzKCkgew0KICAgIGNvbnN0IGZpbHRlcmVkT2ZmZXJzID0gdGhpcy5zdGF0ZS5zZWxlY3RlZENhdGVnb3J5DQogICAgICA/IHRoaXMuc3RhdGUub2ZmZXJzLmZpbHRlcihvZmZlciA9PiBvZmZlci5jYXRlZ29yeT8uc2x1ZyA9PT0gdGhpcy5zdGF0ZS5zZWxlY3RlZENhdGVnb3J5KQ0KICAgICAgOiB0aGlzLnN0YXRlLm9mZmVyczsNCg0KICAgIHJldHVybiBgDQogICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yaWVzLWNvbnRhaW5lciI+DQogICAgICAgIDxoMj5DYXRlZ29yaWVzPC9oMj4NCiAgICAgICAgPGRpdiBjbGFzcz0iY2F0ZWdvcnktZmlsdGVycyI+DQogICAgICAgICAgPGJ1dHRvbiBjbGFzcz0iY2F0ZWdvcnktZmlsdGVyICR7IXRoaXMuc3RhdGUuc2VsZWN0ZWRDYXRlZ29yeSA/ICdhY3RpdmUnIDogJyd9IiBvbmNsaWNrPSJhcHAuc2V0U2VsZWN0ZWRDYXRlZ29yeShudWxsKSI+DQogICAgICAgICAgICBBbGwNCiAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAke3RoaXMuc3RhdGUuY2F0ZWdvcmllcy5tYXAoY2F0ID0+IGANCiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9ImNhdGVnb3J5LWZpbHRlciAke3RoaXMuc3RhdGUuc2VsZWN0ZWRDYXRlZ29yeSA9PT0gY2F0LnNsdWcgPyAnYWN0aXZlJyA6ICcnfSIgb25jbGljaz0iYXBwLnNldFNlbGVjdGVkQ2F0ZWdvcnkoJyR7Y2F0LnNsdWd9JykiPg0KICAgICAgICAgICAgICAke2NhdC5uYW1lfQ0KICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgYCkuam9pbignJyl9DQogICAgICAgIDwvZGl2Pg0KDQogICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLWdyaWQiPg0KICAgICAgICAgICR7ZmlsdGVyZWRPZmZlcnMubWFwKG9mZmVyID0+IHRoaXMucmVuZGVyT2ZmZXJDYXJkKG9mZmVyKSkuam9pbignJyl9DQogICAgICAgIDwvZGl2Pg0KICAgICAgPC9kaXY+DQogICAgYDsNCiAgfQ0KDQogIHJlbmRlck9mZmVyRGV0YWlsKCkgew0KICAgIGlmICghdGhpcy5zdGF0ZS5zZWxlY3RlZE9mZmVyKSB7DQogICAgICByZXR1cm4gYDxwPk9mZmVyIG5vdCBmb3VuZCBvciBsb2FkaW5nLi4uPC9wPmA7DQogICAgfQ0KDQogICAgY29uc3Qgb2ZmZXIgPSB0aGlzLnN0YXRlLnNlbGVjdGVkT2ZmZXI7DQoNCiAgICByZXR1cm4gYA0KICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItZGV0YWlsIj4NCiAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJhcHAubmF2aWdhdGUoJ2xhbmRpbmcnKSIgY2xhc3M9ImJhY2stYnRuIj7ihpAgQmFjazwvYnV0dG9uPg0KDQogICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLWRldGFpbC1jYXJkIj4NCiAgICAgICAgICA8aDE+JHtvZmZlci50aXRsZX08L2gxPg0KICAgICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLW1ldGEiPg0KICAgICAgICAgICAgPHNwYW4gY2xhc3M9ImNhdGVnb3J5Ij4ke29mZmVyLmNhdGVnb3J5Py5uYW1lIHx8ICdHZW5lcmFsJ308L3NwYW4+DQogICAgICAgICAgICA8c3BhbiBjbGFzcz0ic3RhdHVzIj4ke29mZmVyLnN0YXR1c308L3NwYW4+DQogICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1kZXNjcmlwdGlvbiI+DQogICAgICAgICAgICA8aDM+RGVzY3JpcHRpb248L2gzPg0KICAgICAgICAgICAgPHA+JHtvZmZlci5kZXNjcmlwdGlvbn08L3A+DQogICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1pbmZvIj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImluZm8taXRlbSI+DQogICAgICAgICAgICAgIDxzdHJvbmc+UGF5b3V0Ojwvc3Ryb25nPiAkJHtvZmZlci5wYXlvdXR9ICR7b2ZmZXIucGF5b3V0X3R5cGV9DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImluZm8taXRlbSI+DQogICAgICAgICAgICAgIDxzdHJvbmc+RXhwaXJlczo8L3N0cm9uZz4gJHtvZmZlci5leHBpcmVzX2F0ID8gbmV3IERhdGUob2ZmZXIuZXhwaXJlc19hdCkudG9Mb2NhbGVEYXRlU3RyaW5nKCkgOiAnTm8gZXhwaXJhdGlvbid9DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImluZm8taXRlbSI+DQogICAgICAgICAgICAgIDxzdHJvbmc+Q2xpY2tzOjwvc3Ryb25nPiAke29mZmVyLmNsaWNrX2NvdW50IHx8IDB9DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImluZm8taXRlbSI+DQogICAgICAgICAgICAgIDxzdHJvbmc+Q29udmVyc2lvbnM6PC9zdHJvbmc+ICR7b2ZmZXIuY29udmVyc2lvbl9jb3VudCB8fCAwfQ0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1yZXF1aXJlbWVudHMiPg0KICAgICAgICAgICAgPGgzPlJlcXVpcmVtZW50czwvaDM+DQogICAgICAgICAgICA8dWw+DQogICAgICAgICAgICAgICR7b2ZmZXIucmVxdWlyZW1lbnRzPy5tYXAocmVxID0+IGA8bGk+JHtyZXF9PC9saT5gKS5qb2luKCcnKSB8fCAnPGxpPk5vIHNwZWNpZmljIHJlcXVpcmVtZW50czwvbGk+J30NCiAgICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItY3RhIj4NCiAgICAgICAgICAgIDxhIGhyZWY9IiR7b2ZmZXIudXJsfSIgdGFyZ2V0PSJfYmxhbmsiIGNsYXNzPSJjdGEtYnV0dG9uIiBvbmNsaWNrPSJhcHAuaGFuZGxlT2ZmZXJDbGljaygnJHtvZmZlci5pZH0nKSI+DQogICAgICAgICAgICAgIEFwcGx5IE5vdw0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgIDwvZGl2Pg0KICAgICAgPC9kaXY+DQogICAgYDsNCiAgfQ0KDQogIHJlbmRlckFkbWluKCkgew0KICAgIHJldHVybiBgDQogICAgICA8ZGl2IGNsYXNzPSJhZG1pbi1wYW5lbCI+DQogICAgICAgIDxoMj5BZG1pbiBEYXNoYm9hcmQ8L2gyPg0KICAgICAgICA8cD5BZG1pbiBmdW5jdGlvbmFsaXR5IHVzaW5nIGV4aXN0aW5nIGJhY2tlbmQgZW5kcG9pbnRzPC9wPg0KDQogICAgICAgIDxkaXYgY2xhc3M9ImFkbWluLWFjdGlvbnMiPg0KICAgICAgICAgIDxidXR0b24gb25jbGljaz0iYXBwLm5hdmlnYXRlKCdsYW5kaW5nJykiIGNsYXNzPSJhZG1pbi1idG4iPkJhY2sgdG8gU2l0ZTwvYnV0dG9uPg0KICAgICAgICAgIDxidXR0b24gb25jbGljaz0iYXBwLmxvYWRPZmZlcnNBZG1pbigpIiBjbGFzcz0iYWRtaW4tYnRuIj5NYW5hZ2UgT2ZmZXJzPC9idXR0b24+DQogICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJhcHAubG9hZFJldmVudWVBZG1pbigpIiBjbGFzcz0iYWRtaW4tYnRuIj5WaWV3IFJldmVudWU8L2J1dHRvbj4NCiAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgPGRpdiBpZD0iYWRtaW4tY29udGVudCI+DQogICAgICAgICAgPHA+QWRtaW4gaW50ZXJmYWNlIGNvbWluZyBzb29uLi4uPC9wPg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KICAgIGA7DQogIH0NCg0KICByZW5kZXJPZmZlckNhcmQob2ZmZXIpIHsNCiAgICByZXR1cm4gYA0KICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItY2FyZCIgb25jbGljaz0iYXBwLm5hdmlnYXRlKCdvZmZlci1kZXRhaWw/aWQ9JHtvZmZlci5pZH0nKSI+DQogICAgICAgIDxoMz4ke29mZmVyLnRpdGxlfTwvaDM+DQogICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLW1ldGEiPg0KICAgICAgICAgIDxzcGFuIGNsYXNzPSJjYXRlZ29yeSI+JHtvZmZlci5jYXRlZ29yeT8ubmFtZSB8fCAnR2VuZXJhbCd9PC9zcGFuPg0KICAgICAgICAgIDxzcGFuIGNsYXNzPSJzdGF0dXMgJHtvZmZlci5zdGF0dXN9Ij4ke29mZmVyLnN0YXR1c308L3NwYW4+DQogICAgICAgIDwvZGl2Pg0KICAgICAgICA8cCBjbGFzcz0iZGVzY3JpcHRpb24iPiR7b2ZmZXIuZGVzY3JpcHRpb259PC9wPg0KICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1mb290ZXIiPg0KICAgICAgICAgIDxzcGFuIGNsYXNzPSJwYXlvdXQiPiQke29mZmVyLnBheW91dH0gJHtvZmZlci5wYXlvdXRfdHlwZX08L3NwYW4+DQogICAgICAgICAgPHNwYW4gY2xhc3M9InN0YXR1cyAke29mZmVyLnN0YXR1c30iPiR7b2ZmZXIuc3RhdHVzfTwvc3Bhbj4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCiAgICBgOw0KICB9DQoNCiAgc2V0U2VsZWN0ZWRDYXRlZ29yeShjYXRlZ29yeSkgew0KICAgIHRoaXMuc3RhdGUuc2VsZWN0ZWRDYXRlZ29yeSA9IGNhdGVnb3J5Ow0KICAgIHRoaXMucmVuZGVyKCk7DQogIH0NCg0KICBhc3luYyBoYW5kbGVPZmZlckNsaWNrKG9mZmVySWQpIHsNCiAgICBjb25zdCBjbGlja0RhdGEgPSB7DQogICAgICBvZmZlcl9pZDogb2ZmZXJJZCwNCiAgICAgIGlwX2FkZHJlc3M6ICd1bmtub3duJywNCiAgICAgIHVzZXJfYWdlbnQ6IG5hdmlnYXRvci51c2VyQWdlbnQsDQogICAgICByZWZlcnJlcjogZG9jdW1lbnQucmVmZXJyZXIsDQogICAgICBtZXRhZGF0YTogew0KICAgICAgICBzb3VyY2U6ICdmcm9udGVuZF9tdnAnLA0KICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKQ0KICAgICAgfQ0KICAgIH07DQoNCiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnRyYWNrQ2xpY2sob2ZmZXJJZCwgY2xpY2tEYXRhKTsNCg0KICAgIGlmIChyZXN1bHQuc3VjY2Vzcykgew0KICAgICAgY29uc29sZS5sb2coJ0NsaWNrIHRyYWNrZWQgc3VjY2Vzc2Z1bGx5OicsIHJlc3VsdCk7DQogICAgICAvLyBUaGUgYmFja2VuZCBoYW5kbGVzIHRoZSBhY3R1YWwgcmVkaXJlY3QgdG8gdGhlIENQQSBkZXN0aW5hdGlvbg0KICAgICAgLy8gV2UganVzdCBuZWVkIHRvIHRyYWNrIHRoZSBjbGljayBhbmQgbGV0IHRoZSBiYWNrZW5kIGhhbmRsZSB0aGUgcmVkaXJlY3QNCiAgICAgIHJldHVybiB0cnVlOw0KICAgIH0gZWxzZSB7DQogICAgICBjb25zb2xlLmVycm9yKCdDbGljayB0cmFja2luZyBmYWlsZWQ6JywgcmVzdWx0LmVycm9yKTsNCiAgICAgIC8vIFNob3cgZXJyb3Igc3RhdGUgYnV0IGNvbnRpbnVlIG5hdmlnYXRpb24NCiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSByZXN1bHQuZXJyb3IgfHwgJ1RyYWNraW5nIGZhaWxlZCc7DQogICAgICB0aGlzLnJlbmRlcigpOw0KICAgICAgcmV0dXJuIGZhbHNlOw0KICAgIH0NCiAgfQ0KfQ0KDQovLyBJbml0aWFsaXplIHRoZSBhcHAgd2hlbiBET00gaXMgcmVhZHkNCmlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHsNCiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHsNCiAgICB3aW5kb3cuYXBwID0gbmV3IENQQUpvYnNBcHAoKTsNCiAgfSk7DQp9IGVsc2Ugew0KICB3aW5kb3cuYXBwID0gbmV3IENQQUpvYnNBcHAoKTsNCn0=', 'base64').toString('utf8'),
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
      SELECT 
        o.id, o.external_id, o.title, o.description, o.description_html,
        o.url, o.apply_url, o.payout, o.payout_type,
        o.company, o.company_domain, o.company_logo,
        o.location, o.location_city, o.location_state, o.location_country, o.location_country_code, o.remote,
        o.employment_type, o.experience, o.skills,
        o.salary_min, o.salary_max, o.salary_currency, o.salary_period, o.salary_display,
        o.requirements, o.status, o.expires_at, o.date_posted, o.valid_through,
        o.click_count, o.conversion_count, o.revenue,
        o.created_at, o.updated_at,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        s.id as source_id, s.name as source_name
      FROM offers o
      LEFT JOIN categories c ON o.category_id = c.id
      LEFT JOIN offer_sources s ON o.source_id = s.id
      WHERE o.id = ?
    `).bind(offerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Offer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse skills JSON if present
    const skills = result.skills ? JSON.parse(result.skills) : [];

    const offer = {
      id: result.id,
      external_id: result.external_id,
      title: result.title,
      description: result.description,
      description_html: result.description_html,
      url: result.url,
      apply_url: result.apply_url,
      payout: result.payout,
      payout_type: result.payout_type,
      company: result.company,
      company_domain: result.company_domain,
      company_logo: result.company_logo,
      location: result.location,
      location_city: result.location_city,
      location_state: result.location_state,
      location_country: result.location_country,
      location_country_code: result.location_country_code,
      remote: Boolean(result.remote),
      employment_type: result.employment_type,
      experience: result.experience,
      skills: skills,
      salary: {
        min: result.salary_min,
        max: result.salary_max,
        currency: result.salary_currency,
        period: result.salary_period,
        display: result.salary_display
      },
      requirements: result.requirements,
      status: result.status,
      expires_at: result.expires_at,
      date_posted: result.date_posted,
      valid_through: result.valid_through,
      click_count: result.click_count,
      conversion_count: result.conversion_count,
      revenue: result.revenue,
      created_at: result.created_at,
      updated_at: result.updated_at,
      category: {
        id: result.category_id,
        name: result.category_name,
        slug: result.category_slug
      },
      source: {
        id: result.source_id,
        name: result.source_name
      }
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
