# Cache Clean Action

Clean up old duplicate caches by key prefix

## Example Usage

```yaml
uses: PCSX2/cache-clean-action@v1.0.0
with:
  items: '[{"key": "deps", "count": 2}, {"key": "cache", "count": 1}]'
  token: ${{ secrets.GITHUB_TOKEN }}
```
For the following caches in descending order of recency of use, this would do the following
```
KEEP macos-x86-deps-a  # matches deps, 1st with prefix macos-x86-deps
KEEP macos-arm-deps-a  # matches deps, 1st with prefix macos-arm-deps
KEEP macos-x86-deps-b  # matches deps, 2nd with prefix macos-x86-deps
DEL  macos-x86-deps-c  # matches deps, 3rd with prefix macos-x86-deps
KEEP macos-x86-other   # matches no items
KEEP macos-x86-cache-a # matches cache, 1st with prefix macos-x86-cache
DEL  macos-x86-cache-b # matches cache, 2nd with prefix macos-x86-cache
```
