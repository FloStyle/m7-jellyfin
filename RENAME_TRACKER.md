# Repository Rename Tracker

> **Status:** PENDING — Rename not yet executed
> **Target:** `FloStyle/m7-jellyfin` → `FloStyle/m7-jellyfin-neo`
> **Created:** 2026-08-27

---

## ⚠️ Pre-Rename Checklist

Complete ALL items BEFORE executing the rename on GitHub.

### URLs & References

- [ ] `README.md` — Update all `github.com/FloStyle/m7-jellyfin` links
- [ ] `AGENTS.md` — Update repository URL, issues API, releases, readme/agents/contributing links
- [ ] `CHANGELOG.md` — Update any hardcoded URLs
- [ ] `package.json` — Update `repository.url` and `homepage`
- [ ] `SECURITY.md` — Update issue URL
- [ ] `TASKS.md` — Update any hardcoded URLs
- [ ] `.github/workflows/dev.yml` — Update commit link URL
- [ ] `.github/workflows/stable.yml` — Update commit link URL
- [ ] `src/upgrader.js` — Update `repo` and API endpoint
- [ ] `src/utils.js` — Update `getLatestPlugin()` download URL
- [ ] `docs/missions/stability-2-updater.md` — Update all references
- [ ] `docs/plans/plan-drop-in-updates.md` — Update all references

### CI/CD

- [ ] `.github/workflows/release.yml` — Update TODO comment target
- [ ] `.github/workflows/dev.yml` — Update TODO comment target
- [ ] `.github/workflows/stable.yml` — Update TODO comment target
- [ ] `.github/release.yml` — Update TODO comment target + compare URL in template
- [ ] `scripts/release.sh` — Update any hardcoded URLs

### GitHub Settings

- [ ] Rename repository on GitHub (Settings → General → Change repository name)
- [ ] Update default branch if needed (should remain `main`)
- [ ] Verify GitHub Actions still trigger (check workflow runs)
- [ ] Verify existing releases still accessible (GitHub redirects automatically)
- [ ] Update any fork upstream URLs in local clones

### Post-Rename Verification

- [ ] `gh repo view FloStyle/m7-jellyfin-neo` resolves correctly
- [ ] Old URL `github.com/FloStyle/m7-jellyfin` redirects to new URL
- [ ] Release assets still downloadable from old URLs
- [ ] CI workflows run successfully on new repo
- [ ] PS3 upgrader still functional (test with a dummy release)
- [ ] Update `scripts/.ps3-test.env` if it contains hardcoded URLs

---

## 📋 Post-Rename Actions

After the rename is complete:

1. Update this file: set `Status: COMPLETE` and add the completion date
2. Remove `<!-- RENAME-TRACKER -->` comments from all files (or leave them as history)
3. Announce the rename in GitHub Discussions / Issues
4. Update any external documentation or links pointing to the old URL

---

## 🔍 Hidden Comment Markers

All files with hardcoded references have been tagged with:
```html
<!-- RENAME-TRACKER: Update to m7-jellyfin-neo -->
```

To find all tagged files:
```bash
grep -rl "RENAME-TRACKER" . --include="*.md" --include="*.yml" --include="*.yaml" --include="*.json" --include="*.js"
```
