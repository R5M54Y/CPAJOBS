/* src/main.js - Entry point for CPA JOBS MVP
   Phase 2: Offer Engine - Add categories, offer CRUD, status management
   All handlers expect D1 and KV bindings injected by Cloudflare
*/

// Static file contents embedded as base64 for Cloudflare Workers deployment
const STATIC_FILES = {
  'index.html': Buffer.from('PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+Q1BBIEpPQlMgLSBGaW5kIFlvdXIgTmV4dCBDUEEgT3Bwb3J0dW5pdHk8L3RpdGxlPgogIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0iY3NzL3N0eWxlLmNzcyI+CiAgPGJhc2UgaHJlZj0iLyI+CjwvaGVhZD4KPGJvZHk+CiAgPGhlYWRlcj4KICAgIDxuYXYgY2xhc3M9Im5hdiI+CiAgICAgIDxhIGhyZWY9Ii8iIGNsYXNzPSJsb2dvIj5DUEEgSk9CUzwvYT4KICAgICAgPGRpdiBjbGFzcz0ibmF2LWxpbmtzIj4KICAgICAgICA8YSBocmVmPSIvIj5Ib21lPC9hPgogICAgICAgIDxhIGhyZWY9Ii9jYXRlZ29yaWVzIj5DYXRlZ29yaWVzPC9hPgogICAgICAgIDxhIGhyZWY9Ii9hZG1pbiI+QWRtaW48L2E+CiAgICAgIDwvZGl2PgogICAgPC9uYXY+CiAgPC9oZWFkZXI+CgogIDxtYWluIGlkPSJhcHAiPgogICAgPCEtLSBDb250ZW50IHdpbGwgYmUgbG9hZGVkIGhlcmUgLS0+CiAgPC9tYWluPgoKICA8Zm9vdGVyPgogICAgPHA+JmNvcHk7IDIwMjQgQ1BBIEpPQlMuIFlvdXIgZ2F0ZXdheSB0byBDUEEgb3Bwb3J0dW5pdGllcy48L3A+CiAgPC9mb290ZXI+CgogIDxzY3JpcHQgc3JjPSJqcy9hcHAuanMiPjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4=', 'base64').toString('utf8'),
  'js/app.js': Buffer.from('YXBwLmpzIC0gQ1BBIEpPQlMgRnJvbnRlbmQgTVZQCgpjbGFzcyBDUEFKb2JzQXBwIHsKICBjb25zdHJ1Y3RvcigpIHsKICAgIHRoaXMuc3RhdGUgPSB7CiAgICAgIGN1cnJlbnRWaWV3OiAnbGFuZGluZycsCiAgICAgIGNhdGVnb3JpZXM6IFtdLAogICAgICBvZmZlcnM6IFtdLAogICAgICBzZWxlY3RlZENhdGVnb3J5OiBudWxsLAogICAgICBsb2FkaW5nOiBmYWxzZSwKICAgICAgZXJyb3I6IG51bGwsCiAgICAgIHNlbGVjdGVkT2ZmZXI6IG51bGwsCiAgICAgIHRyYWNraW5nRGF0YTogbnVsbAogICAgfTsKICAgIHRoaXMuYmFzZVVybCA9ICcvJzsKICAgIHRoaXMuaW5pdCgpOwogIH0KCiAgaW5pdCgpIHsKICAgIC8vIENoZWNrIFVSTCBoYXNoIGZvciBuYXZpZ2F0aW9uCiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsICgpID0+IHRoaXMuaGFuZGxlUm91dGUoKSk7CiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHRoaXMuaGFuZGxlUm91dGUoKSk7CiAgICB0aGlzLnJlbmRlcigpOwogIH0KCiAgYXN5bmMgaGFuZGxlUm91dGUoKSB7CiAgICBjb25zdCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoMSkgfHwgJ2xhbmRpbmcnOwogICAgdGhpcy5zdGF0ZS5jdXJyZW50VmlldyA9IGhhc2g7CiAgICAKICAgIHN3aXRjaCAoaGFzaCkgewogICAgICBjYXNlICdsYW5kaW5nJzoKICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYW5kaW5nKCk7CiAgICAgICAgYnJlYWs7CiAgICAgIGNhc2UgJ2NhdGVnb3JpZXMnOgogICAgICAgIGF3YWl0IHRoaXMubG9hZENhdGVnb3JpZXMoKTsKICAgICAgICBicmVhazsKICAgICAgY2FzZSAnb2ZmZXItZGV0YWlsJzoKICAgICAgICB0aGlzLmxvYWRPZmZlckRldGFpbCgpOwogICAgICAgIGJyZWFrOwogICAgICBjYXNlICdhZG1pbic6CiAgICAgICAgdGhpcy5sb2FkQWRtaW4oKTsKICAgICAgICBicmVhazsKICAgICAgZGVmYXVsdDoKICAgICAgICBhd2FpdCB0aGlzLmxvYWRMYW5kaW5nKCk7CiAgICB9CiAgICAKICAgIHRoaXMucmVuZGVyKCk7CiAgfQoKICBhc3luYyBsb2FkTGFuZGluZygpIHsKICAgIHRyeSB7CiAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTsKICAgICAgdGhpcy5zdGF0ZS5lcnJvciA9IG51bGw7CiAgICAgIAogICAgICAvLyBMb2FkIGZlYXR1cmVkIG9mZmVycwogICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL29mZmVycycsIHsgc3RhdHVzOiAnYWN0aXZlJywgbGltaXQ6IDYgfSk7CiAgICAgIGlmIChyZXNwb25zZS5vaykgewogICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7CiAgICAgICAgdGhpcy5zdGF0ZS5vZmZlcnMgPSBkYXRhLm9mZmVycyB8fCBbXTsKICAgICAgfQogICAgICAKICAgICAgLy8gTG9hZCBjYXRlZ29yaWVzIGZvciBuYXZpZ2F0aW9uCiAgICAgIGNvbnN0IGNhdGVnb3JpZXNSZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL2NhdGVnb3JpZXMnKTsKICAgICAgaWYgKGNhdGVnb3JpZXNSZXNwb25zZS5vaykgewogICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjYXRlZ29yaWVzUmVzcG9uc2UuanNvbigpOwogICAgICAgIHRoaXMuc3RhdGUuY2F0ZWdvcmllcyA9IGRhdGEuY2F0ZWdvcmllcyB8fCBbXTsKICAgICAgfQogICAgICAKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSAnRmFpbGVkIHRvIGxvYWQgbGFuZGluZyBwYWdlIGRhdGEnOwogICAgICBjb25zb2xlLmVycm9yKCdMYW5kaW5nIGxvYWQgZXJyb3I6JywgZXJyb3IpOwogICAgfSBmaW5hbGx5IHsKICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTsKICAgIH0KICB9CgogIGFzeW5jIGxvYWRDYXRlZ29yaWVzKCkgewogICAgdHJ5IHsKICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpOwogICAgICB0aGlzLnN0YXRlLmVycm9yID0gbnVsbDsKICAgICAgCiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5hcGlDYWxsKCcvY2F0ZWdvcmllcycpOwogICAgICBpZiAocmVzcG9uc2Uub2spIHsKICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpOwogICAgICAgIHRoaXMuc3RhdGUuY2F0ZWdvcmllcyA9IGRhdGEuY2F0ZWdvcmllcyB8fCBbXTsKICAgICAgfQogICAgICAKICAgICAgLy8gQWxzbyBsb2FkIG9mZmVycyBmb3IgY2F0ZWdvcnkgcGFnZQogICAgICBjb25zdCBvZmZlcnNSZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL29mZmVycycsIHsgc3RhdHVzOiAnYWN0aXZlJywgbGltaXQ6IDIwIH0pOwogICAgICBpZiAob2ZmZXJzUmVzcG9uc2Uub2spIHsKICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgb2ZmZXJzUmVzcG9uc2UuanNvbigpOwogICAgICAgIHRoaXMuc3RhdGUub2ZmZXJzID0gZGF0YS5vZmZlcnMgfHwgW107CiAgICAgIH0KICAgICAgCiAgICB9IGNhdGNoIChlcnJvcikgewogICAgICB0aGlzLnN0YXRlLmVycm9yID0gJ0ZhaWxlZCB0byBsb2FkIGNhdGVnb3JpZXMnOwogICAgICBjb25zb2xlLmVycm9yKCdDYXRlZ29yaWVzIGxvYWQgZXJyb3I6JywgZXJyb3IpOwogICAgfSBmaW5hbGx5IHsKICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTsKICAgIH0KICB9CgogIGxvYWRPZmZlckRldGFpbCgpIHsKICAgIGNvbnN0IHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7CiAgICBjb25zdCBvZmZlcklkID0gdXJsUGFyYW1zLmdldCgnaWQnKTsKICAgIAogICAgaWYgKCFvZmZlcklkKSB7CiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSAnT2ZmZXIgSUQgbm90IGZvdW5kJzsKICAgICAgdGhpcy5uYXZpZ2F0ZSgnbGFuZGluZycpOwogICAgICByZXR1cm47CiAgICB9CiAgICAKICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTsKICAgIHRoaXMuc3RhdGUuZXJyb3IgPSBudWxsOwogICAgCiAgICAvLyBMb2FkIHNwZWNpZmljIG9mZmVyCiAgICB0aGlzLmFwaUNhbGwoYC9vZmZlcnMvJHtvZmZlcklkfWApCiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHsKICAgICAgICBpZiAocmVzcG9uc2Uub2spIHsKICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT2ZmZXIgbm90IGZvdW5kJyk7CiAgICAgICAgfQogICAgICB9KQogICAgICAudGhlbihkYXRhID0+IHsKICAgICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkT2ZmZXIgPSBkYXRhOwogICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7CiAgICAgIH0pCiAgICAgIC5jYXRjaChlcnJvciA9PiB7CiAgICAgICAgdGhpcy5zdGF0ZS5lcnJvciA9ICdGYWlsZWQgdG8gbG9hZCBvZmZlciBkZXRhaWxzJzsKICAgICAgICBjb25zb2xlLmVycm9yKCdPZmZlciBkZXRhaWwgZXJyb3I6JywgZXJyb3IpOwogICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7CiAgICAgIH0pOwogIH0KCiAgbG9hZEFkbWluKCkgewogICAgLy8gQWRtaW4gdmlldyB1c2VzIGV4aXN0aW5nIGJhY2tlbmQgZW5kcG9pbnRzCiAgICB0aGlzLnN0YXRlLmN1cnJlbnRWaWV3ID0gJ2FkbWluJzsKICAgIHRoaXMucmVuZGVyKCk7CiAgfQoKICBhc3luYyB0cmFja0NsaWNrKG9mZmVySWQsIHVzZXJEYXRhID0ge30pIHsKICAgIHRyeSB7CiAgICAgIGNvbnN0IHBheWxvYWQgPSB7CiAgICAgICAgb2ZmZXJfaWQ6IG9mZmVySWQsCiAgICAgICAgaXBfYWRkcmVzczogdXNlckRhdGEuaXAgfHwgJ3Vua25vd24nLAogICAgICAgIHVzZXJfYWdlbnQ6IHVzZXJEYXRhLnVzZXJBZ2VudCB8fCAnJywKICAgICAgICByZWZlcnJlcjogdXNlckRhdGEucmVmZXJyZXIgfHwgJycsCiAgICAgICAgbWV0YWRhdGE6IHVzZXJEYXRhLm1ldGFkYXRhIHx8IHt9CiAgICAgIH07CiAgICAgIAogICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYXBpQ2FsbCgnL3RyYWNrL2NsaWNrJywgJ1BPU1QnLCBwYXlsb2FkKTsKICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsKICAgICAgCiAgICAgIHJldHVybiB7CiAgICAgICAgc3VjY2VzczogcmVzcG9uc2Uub2ssCiAgICAgICAgY2xpY2tJZDogZGF0YS5jbGlja19pZCwKICAgICAgICBtZXNzYWdlOiBkYXRhLm1lc3NhZ2UsCiAgICAgICAgZXJyb3I6ICFyZXNwb25zZS5vayA/IGRhdGEuZXJyb3IgOiBudWxsCiAgICAgIH07CiAgICAgIAogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgY29uc29sZS5lcnJvcignQ2xpY2sgdHJhY2tpbmcgZXJyb3I6JywgZXJyb3IpOwogICAgICByZXR1cm4gewogICAgICAgIHN1Y2Nlc3M6IGZhbHNlLAogICAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHRyYWNrIGNsaWNrJwogICAgICB9OwogICAgfQogIH0KCiAgYXN5bmMgYXBpQ2FsbChlbmRwb2ludCwgbWV0aG9kID0gJ0dFVCcsIGJvZHkgPSBudWxsKSB7CiAgICBjb25zdCB1cmwgPSB0aGlzLmJhc2VVcmwgKyBlbmRwb2ludDsKICAgIGNvbnN0IG9wdGlvbnMgPSB7CiAgICAgIG1ldGhvZCwKICAgICAgaGVhZGVyczogewogICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicKICAgICAgfQogICAgfTsKICAgIAogICAgaWYgKGJvZHkpIHsKICAgICAgb3B0aW9ucy5ib2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keSk7CiAgICB9CiAgICAKICAgIHRyeSB7CiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCBvcHRpb25zKTsKICAgICAgcmV0dXJuIHJlc3BvbnNlOwogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgY29uc29sZS5lcnJvcignQVBJIGNhbGwgZXJyb3I6JywgZXJyb3IpOwogICAgICB0aHJvdyBlcnJvcjsKICAgIH0KICB9CgogIHNldExvYWRpbmcoaXNMb2FkaW5nKSB7CiAgICB0aGlzLnN0YXRlLmxvYWRpbmcgPSBpc0xvYWRpbmc7CiAgICB0aGlzLnJlbmRlcigpOwogIH0KCiAgbmF2aWdhdGUocGF0aCkgewogICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBwYXRoOwogIH0KCiAgcmVuZGVyKCkgewogICAgY29uc3QgYXBwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpOwogICAgaWYgKCFhcHApIHJldHVybjsKICAgIAogICAgbGV0IGh0bWwgPSAnJzsKICAgIAogICAgc3dpdGNoICh0aGlzLnN0YXRlLmN1cnJlbnRWaWV3KSB7CiAgICAgIGNhc2UgJ2xhbmRpbmcnOgogICAgICAgIGh0bWwgPSB0aGlzLnJlbmRlckxhbmRpbmcoKTsKICAgICAgICBicmVhazsKICAgICAgY2FzZSAnY2F0ZWdvcmllcyc6CiAgICAgICAgaHRtbCA9IHRoaXMucmVuZGVyQ2F0ZWdvcmllcygpOwogICAgICAgIGJyZWFrOwogICAgICBjYXNlICdvZmZlci1kZXRhaWwnOgogICAgICAgIGh0bWwgPSB0aGlzLnJlbmRlck9mZmVyRGV0YWlsKCk7CiAgICAgICAgYnJlYWs7CiAgICAgIGNhc2UgJ2FkbWluJzoKICAgICAgICBodG1sID0gdGhpcy5yZW5kZXJBZG1pbigpOwogICAgICAgIGJyZWFrOwogICAgICBkZWZhdWx0OgogICAgICAgIGh0bWwgPSB0aGlzLnJlbmRlckxhbmRpbmcoKTsKICAgIH0KICAgIAogICAgYXBwLmlubmVySFRNTCA9IGh0bWw7CiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKCk7CiAgfQoKICByZW5kZXJMYW5kaW5nKCkgewogICAgcmV0dXJuIGAKICAgICAgPHNlY3Rpb24gY2xhc3M9Imhlcm8iPgogICAgICAgIDxoMT5GaW5kIFlvdXIgTmV4dCBDUEEgT3Bwb3J0dW5pdHk8L2gxPgogICAgICAgIDxwPkRpc2NvdmVyIGhpZ2gtcGF5aW5nIENQQSBwcm9ncmFtcyBhbmQgc3RhcnQgZWFybmluZyB0b2RheTwvcD4KICAgICAgICAke3RoaXMuc3RhdGUubG9hZGluZyA/ICc8cD5Mb2FkaW5nLi4uPC9wPicgOiAnJ30KICAgICAgICAke3RoaXMuc3RhdGUuZXJyb3IgPyBgPHAgY2xhc3M9ImVycm9yIj4ke3RoaXMuc3RhdGUuZXJyb3J9PC9wPmAgOiAnJ30KICAgICAgPC9zZWN0aW9uPgoKICAgICAgPHNlY3Rpb24gY2xhc3M9Im9mZmVyLWxpc3QiPgogICAgICAgIDxoMj5GZWF0dXJlZCBPcHBvcnR1bml0aWVzPC9oMj4KICAgICAgICAke3RoaXMuc3RhdGUub2ZmZXJzLm1hcChvZmZlciA9PiB0aGlzLnJlbmRlck9mZmVyQ2FyZChvZmZlcikpLmpvaW4oJycpfQogICAgICA8L3NlY3Rpb24+CgogICAgICA8c2VjdGlvbiBjbGFzcz0ib2ZmZXItbGlzdCI+CiAgICAgICAgPGgyPkJyb3dzZSBDYXRlZ29yaWVzPC9oMj4KICAgICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yeS1ncmlkIj4KICAgICAgICAgICR7dGhpcy5zdGF0ZS5jYXRlZ29yaWVzLm1hcChjYXQgPT4gYAogICAgICAgICAgICA8ZGl2IGNsYXNzPSJjYXRlZ29yeS1jYXJkIiBvbmNsaWNrPSJhcHAubmF2aWdhdGUoJ2NhdGVnb3JpZXMnKSI+CiAgICAgICAgICAgICAgPGgzPiR7Y2F0Lm5hbWV9PC9oMz4KICAgICAgICAgICAgICA8cD4ke2NhdC5kZXNjcmlwdGlvbn08L3A+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgPC9idXR0b24+CiAgICAgICAgPC9kaXY+CiAgICAgIDwvc2VjdGlvbj4KICAgIGA7CiAgfQoKICByZW5kZXJDYXRlZ29yaWVzKCkgewogICAgY29uc3QgZmlsdGVyZWRPZmZlcnMgPSB0aGlzLnN0YXRlLnNlbGVjdGVkQ2F0ZWdvcnkgCiAgICAgID8gdGhpcy5zdGF0ZS5vZmZlcnMuZmlsdGVyKG9mZmVyID0+IG9mZmVyLmNhdGVnb3J5Py5zbHVnID09PSB0aGlzLnN0YXRlLnNlbGVjdGVkQ2F0ZWdvcnkpCiAgICAgIDogdGhpcy5zdGF0ZS5vZmZlcnM7CiAgICAKICAgIHJldHVybiBgCiAgICAgIDxkaXYgY2xhc3M9ImNhdGVnb3JpZXMtY29udGFpbmVyIj4KICAgICAgICA8aDI+Q2F0ZWdvcmllczwvaDI+CiAgICAgICAgPGRpdiBjbGFzcz0iY2F0ZWdvcnktZmlsdGVycyI+CiAgICAgICAgICA8YnV0dG9uIGNsYXNzPSJjYXRlZ29yeS1maWx0ZXIgJHshdGhpcy5zdGF0ZS5zZWxlY3RlZENhdGVnb3J5ID8gJ2FjdGl2ZScgOiAnJ30iIG9uY2xpY2s9ImFwcC5zZXRTZWxlY3RlZENhdGVnb3J5KG51bGwpIj4KICAgICAgICAgICAgQWxsCiAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgICR7dGhpcy5zdGF0ZS5jYXRlZ29yaWVzLm1hcChjYXQgPT4gYAogICAgICAgICAgICA8YnV0dG9uIGNsYXNzPSJjYXRlZ29yeS1maWx0ZXIgJHt0aGlzLnN0YXRlLnNlbGVjdGVkQ2F0ZWdvcnkgPT09IGNhdC5zbHVnID8gJ2FjdGl2ZScgOiAnJ30iIG9uY2xpY2s9ImFwcC5zZXRTZWxlY3RlZENhdGVnb3J5KCcke2NhdC5zbHVnfScpIj4KICAgICAgICAgICAgICAke2NhdC5uYW1lfQogICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgIDwvZGl2PgogICAgICAgIAogICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLWdyaWQiPgogICAgICAgICAgJHtmaWx0ZXJlZE9mZmVycy5tYXAob2ZmZXIgPT4gdGhpcy5yZW5kZXJPZmZlckNhcmQob2ZmZXIpKS5qb2luKCcnKX0KICAgICAgICA8L2Rpdj4KICAgICAgPC9kaXY+CiAgICBgOwogIH0KCiAgcmVuZGVyT2ZmZXJEZXRhaWwoKSB7CiAgICBpZiAoIXRoaXMuc3RhdGUuc2VsZWN0ZWRPZmZlcikgewogICAgICByZXR1cm4gYDxwPk9mZmVyIG5vdCBmb3VuZCBvciBsb2FkaW5nLi4uPC9wPmA7CiAgICB9CiAgICAKICAgIGNvbnN0IG9mZmVyID0gdGhpcy5zdGF0ZS5zZWxlY3RlZE9mZmVyOwogICAgCiAgICByZXR1cm4gYAogICAgICA8ZGl2IGNsYXNzPSJvZmZlci1kZXRhaWwiPgogICAgICAgIDxidXR0b24gb25jbGljaz0iYXBwLm5hdmlnYXRlKCdsYW5kaW5nJykiIGNsYXNzPSJiYWNrLWJ0biI+4oaQIEJhY2s8L2J1dHRvbj4KICAgICAgICAKICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1kZXRhaWwtY2FyZCI+CiAgICAgICAgICA8aDE+JHtvZmZlci50aXRsZX08L2gxPgogICAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItbWV0YSI+CiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJjYXRlZ29yeSI+JHtvZmZlci5jYXRlZ29yeT8ubmFtZSB8fCAnR2VuZXJhbCd9PC9zcGFuPgogICAgICAgICAgICA8c3BhbiBjbGFzcz0ic3RhdHVzIj4ke29mZmVyLnN0YXR1c308L3NwYW4+CiAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIAogICAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItZGVzY3JpcHRpb24iPgogICAgICAgICAgICA8aDM+RGVzY3JpcHRpb248L2gzPgogICAgICAgICAgICA8cD4ke29mZmVyLmRlc2NyaXB0aW9ufTwvcD4KICAgICAgICAgIDwvZGl2PgogICAgICAgICAgCiAgICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1pbmZvIj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0iaW5mby1pdGVtIj4KICAgICAgICAgICAgICA8c3Ryb25nPlBheW91dDo8L3N0cm9uZz4gJCR7b2ZmZXIucGF5b3V0fSAke29mZmVyLnBheW91dF90eXBlfQogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0iaW5mby1pdGVtIj4KICAgICAgICAgICAgICA8c3Ryb25nPkV4cGlyZXM6PC9zdHJvbmc+ICR7b2ZmZXIuZXhwaXJlc19hdCA/IG5ldyBEYXRlKG9mZmVyLmV4cGlyZXNfYXQpLnRvTG9jYWxlRGF0ZVN0cmluZygpIDogJ05vIGV4cGlyYXRpb24nfQogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0iaW5mby1pdGVtIj4KICAgICAgICAgICAgICA8c3Ryb25nPkNsaWNrczo8L3N0cm9uZz4gJHtvZmZlci5jbGlja19jb3VudCB8fCAwfQogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0iaW5mby1pdGVtIj4KICAgICAgICAgICAgICA8c3Ryb25nPkNvbnZlcnNpb25zOjwvc3Ryb25nPiAke29mZmVyLmNvbnZlcnNpb25fY291bnQgfHwgMH0KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIAogICAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItcmVxdWlyZW1lbnRzIj4KICAgICAgICAgICAgPGgzPlJlcXVpcmVtZW50czwvaDM+CiAgICAgICAgICAgIDx1bD4KICAgICAgICAgICAgICAke29mZmVyLnJlcXVpcmVtZW50cz8ubWFwKHJlcSA9PiBgPGxpPiR7cmVxfTwvbGk+YCkuam9pbignJykgfHwgJzxsaT5ObyBzcGVjaWZpYyByZXF1aXJlbWVudHM8L2xpPid9CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgCiAgICAgICAgICA8ZGl2IGNsYXNzPSJvZmZlci1jdGEiPgogICAgICAgICAgICA8YSBocmVmPSIke29mZmVyLnVybH0iIHRhcmdldD0iX2JsYW5rIiBjbGFzcz0iY3RhLWJ1dHRvbiIgb25jbGljaz0iYXBwLmhhbmRsZU9mZmVyQ2xpY2soJyR7b2ZmZXIuaWR9JykiPgogICAgICAgICAgICAgIEFwcGx5IE5vdwogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgIGA7CiAgfQoKICByZW5kZXJBZG1pbigpIHsKICAgIHJldHVybiBgCiAgICAgIDxkaXYgY2xhc3M9ImFkbWluLXBhbmVsIj4KICAgICAgICA8aDI+QWRtaW4gRGFzaGJvYXJkPC9oMj4KICAgICAgICA8cD5BZG1pbiBmdW5jdGlvbmFsaXR5IHVzaW5nIGV4aXN0aW5nIGJhY2tlbmQgZW5kcG9pbnRzPC9wPgogICAgICAgIAogICAgICAgIDxkaXYgY2xhc3M9ImFkbWluLWFjdGlvbnMiPgogICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJhcHAubmF2aWdhdGUoJ2xhbmRpbmcnKSIgY2xhc3M9ImFkbWluLWJ0biI+QmFjayB0byBTaXRlPC9idXR0b24+CiAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9ImFwcC5sb2FkT2ZmZXJzQWRtaW4oKSIgY2xhc3M9ImFkbWluLWJ0biI+TWFuYWdlIE9mZmVyczwvYnV0dG9uPgogICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJhcHAubG9hZFJldmVudWVBZG1pbigpIiBjbGFzcz0iYWRtaW4tYnRuIj5WaWV3IFJldmVudWU8L2J1dHRvbj4KICAgICAgICA8L2Rpdj4KICAgICAgICAKICAgICAgICA8ZGl2IGlkPSJhZG1pbi1jb250ZW50Ij4KICAgICAgICAgIDxwPkFkbWluIGludGVyZmFjZSBjb21pbmcgc29vbi4uLjwvcD4KICAgICAgICA8L2Rpdj4KICAgICAgPC9kaXY+CiAgICBgOwogIH0KCiAgcmVuZGVyT2ZmZXJDYXJkKG9mZmVyKSB7CiAgICByZXR1cm4gYAogICAgICA8ZGl2IGNsYXNzPSJvZmZlci1jYXJkIiBvbmNsaWNrPSJhcHAubmF2aWdhdGUoJ29mZmVyLWRldGFpbD9pZD0ke29mZmVyLmlkfScpIj4KICAgICAgICA8aDM+JHtvZmZlci50aXRsZX08L2gzPgogICAgICAgIDxkaXYgY2xhc3M9Im9mZmVyLW1ldGEiPgogICAgICAgICAgPHNwYW4gY2xhc3M9ImNhdGVnb3J5Ij4ke29mZmVyLmNhdGVnb3J5Py5uYW1lIHx8ICdHZW5lcmFsJ308L3NwYW4+CiAgICAgICAgICA8c3BhbiBjbGFzcz0ic3RhdHVzICR7b2ZmZXIuc3RhdHVzfSI+JHtvZmZlci5zdGF0dXN9PC9zcGFuPgogICAgICAgIDwvZGl2PgogICAgICAgIDxwIGNsYXNzPSJkZXNjcmlwdGlvbiI+JHtvZmZlci5kZXNjcmlwdGlvbn08L3A+CiAgICAgICAgPGRpdiBjbGFzcz0ib2ZmZXItZm9vdGVyIj4KICAgICAgICAgIDxzcGFuIGNsYXNzPSJwYXlvdXQiPiQke29mZmVyLnBheW91dH0gJHtvZmZlci5wYXlvdXRfdHlwZX08L3NwYW4+CiAgICAgICAgICA8c3BhbiBjbGFzcz0ic3RhdHVzICR7b2ZmZXIuc3RhdHVzfSI+JHtvZmZlci5zdGF0dXN9PC9zcGFuPgogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgIGA7CiAgfQoKICBzZXRTZWxlY3RlZENhdGVnb3J5KGNhdGVnb3J5KSB7CiAgICB0aGlzLnN0YXRlLnNlbGVjdGVkQ2F0ZWdvcnkgPSBjYXRlZ29yeTsKICAgIHRoaXMucmVuZGVyKCk7CiAgfQoKICBhc3luYyBoYW5kbGVPZmZlckNsaWNrKG9mZmVySWQpIHsKICAgIGNvbnN0IGNsaWNrRGF0YSA9IHsKICAgICAgb2ZmZXJfaWQ6IG9mZmVySWQsCiAgICAgIGlwX2FkZHJlc3M6ICd1bmtub3duJywKICAgICAgdXNlcl9hZ2VudDogbmF2aWdhdG9yLnVzZXJBZ2VudCwKICAgICAgcmVmZXJyZXI6IGRvY3VtZW50LnJlZmVycmVyLAogICAgICBtZXRhZGF0YTogewogICAgICAgIHNvdXJjZTogJ2Zyb250ZW5kX212cCcsCiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkKICAgICAgfQogICAgfTsKICAgIAogICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy50cmFja0NsaWNrKG9mZmVySWQsIGNsaWNrRGF0YSk7CiAgICAKICAgIGlmIChyZXN1bHQuc3VjY2VzcykgewogICAgICBjb25zb2xlLmxvZygnQ2xpY2sgdHJhY2tlZCBzdWNjZXNzZnVsbHk6JywgcmVzdWx0KTsKICAgICAgLy8gVGhlIGJhY2tlbmQgaGFuZGxlcyB0aGUgYWN0dWFsIHJlZGlyZWN0IHRvIHRoZSBDUEEgZGVzdGluYXRpb24KICAgICAgLy8gV2UganVzdCBuZWVkIHRvIHRyYWNrIHRoZSBjbGljayBhbmQgbGV0IHRoZSBiYWNrZW5kIGhhbmRsZSB0aGUgcmVkaXJlY3QKICAgICAgcmV0dXJuIHRydWU7CiAgICB9IGVsc2UgewogICAgICBjb25zb2xlLmVycm9yKCdDbGljayB0cmFja2luZyBmYWlsZWQ6JywgcmVzdWx0LmVycm9yKTsKICAgICAgLy8gU2hvdyBlcnJvciBzdGF0ZSBidXQgY29udGludWUgbmF2aWdhdGlvbgogICAgICB0aGlzLnN0YXRlLmVycm9yID0gcmVzdWx0LmVycm9yIHx8ICdUcmFja2luZyBmYWlsZWQnOwogICAgICB0aGlzLnJlbmRlcigpOwogICAgICByZXR1cm4gZmFsc2U7CiAgICB9CiAgfQp9', 'base64').toString('utf8'),
  'css/style.css': Buffer.from('Lyogc3RhdGljL2Nzcy9zdHlsZS5jc3MgLSBDUEEgSk9CUyBNVlAgU3R5bGVzDQogICBQaGFzZSAwOiBGb3VuZGF0aW9uIC0gQmFzaWMgc3R5bGluZyAqLw0KDQpib2R5IHsNCiAgZm9udC1mYW1pbHk6IHN5c3RlbS11aSwgLWFwcGxlLXN5c3RlbSwgc2Fucy1zZXJpZjsNCiAgbWFyZ2luOiAwOw0KICBwYWRkaW5nOiAwOw0KICBiYWNrZ3JvdW5kOiAjZmFmYWZhOw0KICBjb2xvcjogIzMzMzsNCn0NCg0KaGVhZGVyIHsNCiAgYmFja2dyb3VuZDogI2ZmZjsNCiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMGUwZTA7DQogIHBhZGRpbmc6IDFyZW0gMnJlbTsNCn0NCg0KLm5hdiB7DQogIG1heC13aWR0aDogMTIwMHB4Ow0KICBtYXJnaW46IDAgYXV0bzsNCiAgZGlzcGxheTogZmxleDsNCiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOw0KICBhbGlnbi1pdGVtczogY2VudGVyOw0KfQ0KDQoubG9nbyB7DQogIGZvbnQtc2l6ZTogMS41cmVtOw0KICBmb250LXdlaWdodDogYm9sZDsNCiAgY29sb3I6ICMwMDdhY2M7DQogIHRleHQtZGVjb3JhdGlvbjogbm9uZTsNCn0NCg0KLm5hdi1saW5rcyBhIHsNCiAgbWFyZ2luLWxlZnQ6IDFyZW07DQogIGNvbG9yOiAjMzMzOw0KICB0ZXh0LWRlY29yYXRpb246IG5vbmU7DQogIGZvbnQtc2l6ZTogMC45cmVtOw0KfQ0KDQouaGVybyB7DQogIG1heC13aWR0aDogMTIwMHB4Ow0KICBtYXJnaW46IDNyZW0gYXV0bzsNCiAgcGFkZGluZzogMnJlbTsNCiAgdGV4dC1hbGlnbjogY2VudGVyOw0KICBiYWNrZ3JvdW5kOiAjZmZmOw0KICBib3JkZXItcmFkaXVzOiA4cHg7DQogIGJveC1zaGFkb3c6IDAgMnB4IDRweCByZ2JhKDAsMCwwLDAuMSk7DQp9DQoNCi5oZXJvIGgxIHsNCiAgZm9udC1zaXplOiAycmVtOw0KICBtYXJnaW4tYm90dG9tOiAxcmVtOw0KfQ0KDQouaGVybyBwIHsNCiAgY29sb3I6ICM2NjY7DQogIG1hcmdpbi1ib3R0b206IDJyZW07DQp9DQoNCi5vZmZlci1saXN0IHsNCiAgbWF4LXdpZHRoOiAxMjAwcHg7DQogIG1hcmdpbjogMnJlbSBhdXRvOw0KfQ0KDQoub2ZmZXItY2FyZCB7DQogIGJhY2tncm91bmQ6ICNmZmY7DQogIGJvcmRlcjogMXB4IHNvbGlkICNlMGUwZTA7DQogIGJvcmRlci1yYWRpdXM6IDhweDsNCiAgcGFkZGluZzogMXJlbTsNCiAgbWFyZ2luLWJvdHRvbTogMXJlbTsNCn0NCg0KLm9mZmVyLWNhcmQgaDMgew0KICBtYXJnaW46IDAgMCAwLjVyZW0gMDsNCiAgZm9udC1zaXplOiAxLjFyZW07DQp9DQoNCi5vZmZlci1jYXJkIHAgew0KICBjb2xvcjogIzY2NjsNCiAgZm9udC1zaXplOiAwLjlyZW07DQogIG1hcmdpbjogMC4ycmVtIDA7DQp9DQoNCmZvb3RlciB7DQogIGJhY2tncm91bmQ6ICNmZmY7DQogIGJvcmRlci10b3A6IDFweCBzb2xpZCAjZTBlMGUwOw0KICBwYWRkaW5nOiAxcmVtIDJyZW07DQogIHRleHQtYWxpZ246IGNlbnRlcjsNCiAgZm9udC1zaXplOiAwLjhyZW07DQogIGNvbG9yOiAjODg4Ow0KfQ0K', 'base64').toString('utf8')
};


// Health check endpoint - checks infrastructure status
const health = async (event, env) => {
  // Try to connect to D1 database
  let dbStatus = 'disconnected';
  let kvStatus = 'unavailable';

  try {
    // Check D1 connectivity via environment binding
    if (env && env.DB) {
      // Execute simple query to verify D1 is available
      const dbResult = await env.DB.prepare('SELECT 1 as test').all();
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  // Check KV connectivity
  try {
    if (env && env.CPAJOBS_KV) {
      // Test KV read/write
      await env.CPAJOBS_KV.put('health-check', 'ok', 60);
      const value = await env.CPAJOBS_KV.get('health-check');
      kvStatus = value ? 'available' : 'empty';
    }
  } catch (err) {
    kvStatus = 'error: ' + err.message;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      cache: kvStatus,
      phase: '2-offer-engine'
    })
  };
};

// Minimal routes for Phase 2 - API endpoints using D1 and KV
const routes = {
  // GET /offers - List all active offers with optional filtering by category and status
  'GET /offers': async (event) => {
    const { category, status, page = 1, limit = 20 } = event.query || {};

    try {
      // Build SQL query with optional filtering
      let sql = 'SELECT o.*, c.name as category_name, c.slug as category_slug FROM offers o LEFT JOIN categories c ON o.category_id = c.id WHERE 1=1';
      const params = [];

      if (category) {
        sql += ' AND c.slug = ?';
        params.push(category);
      }

      if (status) {
        sql += ' AND o.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);

      // Use D1 database if available
      if (event.env && event.env.DB) {
        const result = await event.env.DB.prepare(sql).bind(...params).all();
        const offers = (result.results || []).map(offer => ({
          id: offer.id,
          title: offer.title,
          description: offer.description,
          url: offer.url,
          payout: offer.payout,
          payout_type: offer.payout_type,
          status: offer.status,
          expires_at: offer.expires_at,
          click_count: offer.click_count || 0,
          conversion_count: offer.conversion_count || 0,
          revenue: offer.revenue || 0,
          category: offer.category_id ? {
            id: offer.category_id,
            name: offer.category_name,
            slug: offer.category_slug
          } : null,
          source_id: offer.source_id,
          requirements: offer.requirements ? JSON.parse(offer.requirements) : []
        }));

        // Get total count without LIMIT/OFFSET
        const countResult = await event.env.DB.prepare('SELECT COUNT(*) as cnt FROM offers o LEFT JOIN categories c ON o.category_id = c.id WHERE 1=1').bind(...params.slice(0, 2)).all();
        const total = countResult.results?.[0]?.cnt || 0;
        const total_pages = Math.ceil(total / Number(limit));

        return {
          statusCode: 200,
          body: JSON.stringify({
            offers,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total,
              total_pages
            }
          })
        };
      }

      // Fallback to mock data if D1 not available (development)
      return {
        statusCode: 200,
        body: JSON.stringify({
          offers: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            total_pages: 0
          }
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: err.message
        })
      };
    }
  },

  // GET /offers/:id - Get detailed information about a specific offer
  'GET /offers/{id}': async (event) => {
    const offerId = event.params?.id;

    if (!offerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Offer ID is required'
        })
      };
    }

    try {
      // Query D1 database for specific offer with category join
      if (event.env && event.env.DB) {
        const result = await event.env.DB.prepare(`
          SELECT o.*, c.name as category_name, c.slug as category_slug, c.description as category_description
          FROM offers o
          LEFT JOIN categories c ON o.category_id = c.id
          WHERE o.id = ?
        `).bind(offerId).all();

        if (result.results?.length === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              error: 'Not Found',
              message: 'Offer not found'
            })
          };
        }

        const offer = result.results[0];
        return {
          statusCode: 200,
          body: JSON.stringify({
            id: offer.id,
            title: offer.title,
            description: offer.description,
            url: offer.url,
            payout: offer.payout,
            payout_type: offer.payout_type,
            requirements: offer.requirements ? JSON.parse(offer.requirements) : [],
            status: offer.status,
            expires_at: offer.expires_at,
            click_count: offer.click_count || 0,
            conversion_count: offer.conversion_count || 0,
            revenue: offer.revenue || 0,
            created_at: offer.created_at,
            updated_at: offer.updated_at,
            category: offer.category_id ? {
              id: offer.category_id,
              name: offer.category_name,
              slug: offer.category_slug,
              description: offer.category_description
            } : null,
            source_id: offer.source_id
          })
        };
      }

      // Fallback to mock data if D1 not available
      return {
        statusCode: 200,
        body: JSON.stringify({
          id: offerId,
          title: 'Sample Offer',
          description: 'This is a sample offer for testing',
          url: 'https://example.com/offer',
          payout: 10.00,
          payout_type: 'cpa',
          status: 'active',
          click_count: 100,
          conversion_count: 10,
          revenue: 500.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {}
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: err.message
        })
      };
    }
  },

  // GET /categories - List all active categories (Phase 2 new endpoint)
  'GET /categories': async (event) => {
    try {
      // Use D1 database if available
      if (event.env && event.env.DB) {
        const result = await event.env.DB.prepare(
          'SELECT * FROM categories WHERE status = ? ORDER BY name ASC'
        ).bind('active').all();

        const categories = (result.results || []).map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description
        }));

        return {
          statusCode: 200,
          body: JSON.stringify({
            categories
          })
        };
      }

      // Fallback to mock data if D1 not available
      return {
        statusCode: 200,
        body: JSON.stringify({
          categories: [
            {
              id: 'cat-1',
              name: 'Software Development',
              slug: 'software-development',
              description: 'Software development jobs and contracts'
            },
            {
              id: 'cat-2',
              name: 'Data Science',
              slug: 'data-science',
              description: 'Data science and analytics positions'
            }
          ]
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: err.message
        })
      };
    }
  },

  // POST /admin/offers - Create a new offer (Phase 2 new endpoint)
  'POST /admin/offers': async (event) => {
    try {
      const body = JSON.parse(event.body || '{}');
      const {
        title, description, url, payout, payout_type,
        category_id, source_id, requirements, status = 'draft'
      } = body || {};

      // Validate required fields
      if (!title || !url || !payout || !category_id || !source_id) {
        const missing = [];
        if (!title) missing.push('title');
        if (!url) missing.push('url');
        if (!payout) missing.push('payout');
        if (!category_id) missing.push('category_id');
        if (!source_id) missing.push('source_id');

        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Missing required fields',
            details: missing
          })
        };
      }

      // Validate payout is a valid number
      const payoutNum = Number(payout);
      if (!Number.isFinite(payoutNum) || payoutNum < 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'payout must be a valid positive number'
          })
        };
      }

      // Generate UUID for offer ID
      const offerId = `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Set expires_at if status is active and no expires_at provided
      let expiresAt = null;
      if (status === 'active') {
        // Set default expiration 30 days from now
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Insert offer into D1 database
      if (event.env && event.env.DB) {
        await event.env.DB.prepare(`
          INSERT INTO offers (id, title, description, url, payout, payout_type, category_id, source_id, requirements, status, expires_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          offerId,
          title,
          description || '',
          url,
          payoutNum,
          payout_type || 'cpa',
          category_id,
          source_id,
          requirements ? JSON.stringify(requirements) : JSON.stringify([]),
          status,
          expiresAt
        ).run();
      }

      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          id: offerId,
          message: 'Offer created successfully',
          status: status,
          expires_at: expiresAt
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: err.message
        })
      };
    }
  },

  // PUT /admin/offers/:id - Update an existing offer (Phase 2 new endpoint)
  'PUT /admin/offers/{id}': async (event) => {
    try {
      const offerId = event.params?.id;

      if (!offerId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Offer ID is required'
          })
        };
      }

      const body = JSON.parse(event.body || '{}');
      const {
        title, description, url, payout, payout_type,
        category_id, source_id, requirements, status
      } = body || {};

      // Check if offer exists
      if (event.env && event.env.DB) {
        const existing = await event.env.DB.prepare(
          'SELECT id FROM offers WHERE id = ?'
        ).bind(offerId).all();

        if (existing.results?.length === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              error: 'Not Found',
              message: 'Offer not found'
            })
          };
        }
      }

      // Build update query dynamically based on provided fields
      const updateFields = [];
      const updateParams = [];

      if (title !== undefined) {
        updateFields.push('title = ?');
        updateParams.push(title);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateParams.push(description);
      }
      if (url !== undefined) {
        updateFields.push('url = ?');
        updateParams.push(url);
      }
      if (payout !== undefined) {
        const payoutNum = Number(payout);
        if (!Number.isFinite(payoutNum) || payoutNum < 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Bad Request',
              message: 'payout must be a valid positive number'
            })
          };
        }
        updateFields.push('payout = ?');
        updateParams.push(payoutNum);
      }
      if (payout_type !== undefined) {
        updateFields.push('payout_type = ?');
        updateParams.push(payout_type);
      }
      if (category_id !== undefined) {
        updateFields.push('category_id = ?');
        updateParams.push(category_id);
      }
      if (source_id !== undefined) {
        updateFields.push('source_id = ?');
        updateParams.push(source_id);
      }
      if (requirements !== undefined) {
        updateFields.push('requirements = ?');
        updateParams.push(requirements ? JSON.stringify(requirements) : JSON.stringify([]));
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateParams.push(status);

        // Set expires_at if status is active
        if (status === 'active') {
          updateFields.push('expires_at = ?');
          updateParams.push(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
        } else {
          updateFields.push('expires_at = ?');
          updateParams.push(null);
        }
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateParams.push(offerId);

      const sql = `UPDATE offers SET ${updateFields.join(', ')} WHERE id = ?`;

      if (event.env && event.env.DB) {
        await event.env.DB.prepare(sql).bind(...updateParams).run();
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Offer updated successfully',
          id: offerId
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: err.message
        })
      };
    }
  },

  // POST /admin/offers/:id/expire - Manually expire an offer (Phase 2 automation)
  'POST /admin/offers/{id}/expire': async (event) => {
    const offerId = event.params?.id;

    if (!offerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Offer ID is required'
        })
      };
    }

    try {
      if (event.env && event.env.DB) {
        await event.env.DB.prepare(
          'UPDATE offers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind('expired', offerId).run();
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Offer expired successfully',
          id: offerId
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: err.message
        })
      };
    }
  },

  // POST /track/click - Track a click on an offer (Phase 3: Tracking & Revenue)
  'POST /track/click': async (event) => {
    try {
      const clickData = JSON.parse(event.body || '{}');

      // Validate required fields
      if (!clickData || !clickData.offer_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'offer_id is required'
          })
        };
      }

      const ipAddress = clickData.ip_address || 'unknown';
      const userAgent = clickData.user_agent || '';
      const timestamp = Date.now();
      const idempotencyKey = `${clickData.offer_id}-${ipAddress}-${Math.floor(timestamp / 300000)}`;
      const clickId = `click-${idempotencyKey}-${timestamp}`;

      try {
        // Check idempotency: Query clicks table for same offer_id + ip_address + timestamp ± 5 min
        if (event.env && event.env.DB) {
          const existingClick = await event.env.DB.prepare(
            'SELECT id FROM clicks WHERE offer_id = ? AND ip_address = ? AND timestamp >= datetime(CURRENT_TIMESTAMP, "-5 minute")'
          ).bind(clickData.offer_id, ipAddress).all();

          if (existingClick.results?.length > 0) {
            // Duplicate click within 5 minutes - return existing click_id
            return {
              statusCode: 200,
              body: JSON.stringify({
                success: true,
                click_id: existingClick.results[0].id,
                message: 'Click tracked successfully (duplicate ignored)'
              })
            };
          }
        }

        // Insert click into D1 database
        const clickRecordId = `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (event.env && event.env.DB) {
          await event.env.DB.prepare(
            `INSERT INTO clicks (id, offer_id, user_id, ip_address, user_agent, referrer, timestamp, metadata)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`
          ).bind(
            clickRecordId,
            clickData.offer_id,
            clickData.user_id || null,
            ipAddress,
            userAgent,
            clickData.referrer || null,
            JSON.stringify(clickData.metadata || {})
          ).run();

          // Update offer: Increment click_count
          await event.env.DB.prepare(
            'UPDATE offers SET click_count = click_count + 1 WHERE id = ?'
          ).bind(clickData.offer_id).run();
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            click_id: clickId,
            message: 'Click tracked successfully'
          })
        };
      } catch (dbErr) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: dbErr.message
          })
        };
      }
    } catch (parseErr) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body'
        })
      };
    }
  },

  // POST /track/conversion - Track a conversion from an offer (Phase 3: Tracking & Revenue)
  'POST /track/conversion': async (event) => {
    try {
      const conversionData = JSON.parse(event.body || '{}');

      // Validate required fields
      if (!conversionData || !conversionData.offer_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'offer_id is required'
          })
        };
      }

      const timestamp = Date.now();
      const conversionId = `conversion-${conversionData.offer_id}-${timestamp}`;

      try {
        // Check idempotency: Query conversions table for same offer_id + source + timestamp ± 10 min
        if (event.env && event.env.DB) {
          const existingConversion = await event.env.DB.prepare(
            'SELECT id FROM conversions WHERE offer_id = ? AND source = ? AND timestamp >= datetime(CURRENT_TIMESTAMP, "-10 minute")'
          ).bind(conversionData.offer_id, conversionData.source || 'direct').all();

          if (existingConversion.results?.length > 0) {
            // Duplicate conversion within 10 minutes - return existing conversion_id
            return {
              statusCode: 200,
              body: JSON.stringify({
                success: true,
                conversion_id: existingConversion.results[0].id,
                message: 'Conversion tracked successfully (duplicate ignored)'
              })
            };
          }
        }

        // Insert conversion into D1 database
        const conversionRecordId = `conversion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (event.env && event.env.DB) {
          await event.env.DB.prepare(
            `INSERT INTO conversions (id, offer_id, user_id, source, amount, metadata, timestamp, status)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'pending')`
          ).bind(
            conversionRecordId,
            conversionData.offer_id,
            conversionData.user_id || null,
            conversionData.source || 'direct',
            conversionData.amount || 0,
            JSON.stringify(conversionData.metadata || {})
          ).run();

          // Update offer: Increment conversion_count and add to revenue
          await event.env.DB.prepare(
            `UPDATE offers SET
               conversion_count = conversion_count + 1,
               revenue = revenue + ?,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          ).bind(
            conversionData.amount || 0,
            conversionData.offer_id
          ).run();
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            conversion_id: conversionId,
            message: 'Conversion tracked successfully'
          })
        };
      } catch (dbErr) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: dbErr.message
          })
        };
      }
    } catch (parseErr) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body'
        })
      };
    }
  },

  // GET /admin/revenue - Admin revenue dashboard (Phase 3: Tracking & Revenue)
  'GET /admin/revenue': async (event) => {
    try {
      const { period = 'day', offer_id, start_date, end_date } = event.query || {};

      if (!event.env || !event.env.DB) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            revenue: [],
            totals: {
              gross: 0,
              net: 0,
              conversions: 0
            }
          })
        };
      }

      // Build date range query
      let dateCondition = '';
      let dateParams = [];

      if (offer_id) {
        dateCondition = ' AND offer_id = ?';
        dateParams.push(offer_id);
      }

      if (period === 'day') {
        // Daily aggregation - use today's date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        dateCondition += ' AND period_date = ?';
        dateParams.push(todayStr);
      } else if (period === 'week') {
        // Weekly aggregation
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const weekStartStr = startOfWeek.toISOString().split('T')[0];
        dateCondition += ' AND period_date >= ?';
        dateParams.push(weekStartStr);
      } else if (period === 'month') {
        // Monthly aggregation
        const today = new Date();
        const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        dateCondition += ' AND period_date >= ?';
        dateParams.push(monthStartStr);
      } else {
        // Default: no date filter, use provided dates
        if (start_date) {
          dateCondition += ' AND period_date >= ?';
          dateParams.push(start_date);
        }
        if (end_date) {
          dateCondition += ' AND period_date <= ?';
          dateParams.push(end_date);
        }
      }

      // Get revenue data
      const revenueResult = await event.env.DB.prepare(
        `SELECT c.offer_id, o.title as offer_title, c.source, SUM(c.amount) as amount, COUNT(c.id) as conversion_count, c.period_date
         FROM revenue c
         LEFT JOIN offers o ON c.offer_id = o.id
         WHERE 1=1 ${dateCondition}
         GROUP BY c.offer_id, c.source, c.period_date
         ORDER BY c.period_date DESC, amount DESC`
      ).bind(...dateParams).all();

      // Get totals
      const totalsResult = await event.env.DB.prepare(
        `SELECT
           SUM(amount) as gross,
           SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as net,
           COUNT(*) as conversions
         FROM revenue
         WHERE 1=1 ${dateCondition}
         AND status = 'confirmed'`
      ).bind(...dateParams).all();

      const revenueData = (revenueResult.results || []).map(r => ({
        offer_id: r.offer_id,
        offer_title: r.offer_title || 'Unknown Offer',
        source: r.source || 'unknown',
        amount: r.amount || 0,
        conversion_count: r.conversion_count || 0,
        period_date: r.period_date || new Date().toISOString().split('T')[0]
      }));

      const totals = {
        gross: totalsResult.results?.[0]?.gross || 0,
        net: totalsResult.results?.[0]?.net || 0,
        conversions: totalsResult.results?.[0]?.conversions || 0
      };

      return {
        statusCode: 200,
        body: JSON.stringify({
          revenue: revenueData,
          totals: totals
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: err.message
        })
      };
    }
  }
};

// Cloudflare Workers fetch event handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check endpoint
    if (path === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: env.DB ? 'connected' : 'disconnected',
          cache: env.CPAJOBS_KV ? 'available' : 'unavailable',
          phase: '2-offer-engine'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Match routes from routes object
    const method = request.method;
    const routeKey = `${method} ${path}`;

    // Try exact match first
    if (routes[routeKey]) {
      const event = {
        request,
        params: {},
        query: Object.fromEntries(url.searchParams),
        body: request.method !== 'GET' ? await request.text() : null,
        env
      };

      const result = await routes[routeKey](event);
      return new Response(result.body, {
        status: result.statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try parameterized routes (e.g., /offers/{id})
    for (const [routePattern, handler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ');
      if (routeMethod !== method) continue;

      const paramRegex = routePath.replace(/\{(\w+)\}/g, '(?<$1>[^/]+)');
      const regex = new RegExp(`^${paramRegex}$`);
      const match = path.match(regex);

      if (match) {
        const event = {
          request,
          params: match.groups || {},
          query: Object.fromEntries(url.searchParams),
          body: request.method !== 'GET' ? await request.text() : null,
          env
        };

        const result = await handler(event);
        return new Response(result.body, {
          status: result.statusCode,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Serve static files
    if (path === '/' || path === '/index.html') {
      return new Response(STATIC_FILES['index.html'], {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (path === '/js/app.js') {
      return new Response(STATIC_FILES['js/app.js'], {
        status: 200,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });
    }

    if (path === '/css/style.css') {
      return new Response(STATIC_FILES['css/style.css'], {
        status: 200,
        headers: { 'Content-Type': 'text/css; charset=utf-8' }
      });
    }

    // 404 Not Found
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
