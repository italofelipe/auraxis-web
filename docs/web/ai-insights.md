# AI Insights

## Insights Hub

`/insights` renders the Fluida editorial reading when `web.insights.fluida` is enabled.
Historical deep links remain backward compatible: `/insights?open=<insight-id>` bypasses Fluida
and opens the canonical history report for the requested insight.

This keeps shared monthly-report links stable while allowing the default hub experience to evolve
behind the release flag.
