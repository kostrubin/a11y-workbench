#!/usr/bin/env python3
"""Validate the preserved preparation contracts, not application acceptance. No network writes.

Default: Python standard-library structural/contract checks.
--schema: additionally use an already installed jsonschema package; never install it.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def load(relative: str):
    return json.loads((ROOT / relative).read_text(encoding='utf-8'))

def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)

def validate_cross_fields(bundle: dict) -> None:
    """Preparation-fixture sanity, not a production importer/security validator."""
    states = bundle['states']
    require(len({s['stateId'] for s in states}) == len(states), 'duplicate states')
    total_pairs = total_findings = total_manual = total_nodes = 0
    for state in states:
        cap = state['capture']
        pairs = cap['evaluatedPairs']
        keys = [(p['ruleId'], p['subjectId']) for p in pairs]
        require(len(set(keys)) == len(keys), 'duplicate evaluated pair')
        keyed = {key: p['outcome'] for key, p in zip(keys, pairs)}
        for rule, subject in keys:
            require(rule in cap['executedRuleIds'], 'pair rule not declared executed')
            require(subject in cap['observedSubjectIds'], 'pair subject not declared observed')
        findings = state['findings']
        fkeys = [(f['ruleId'], f['subjectId']) for f in findings]
        require(len(set(fkeys)) == len(fkeys), 'duplicate finding')
        require(set(fkeys) == {key for key, outcome in keyed.items() if outcome != 'pass'}, 'finding/pair mismatch')
        for finding in findings:
            require(keyed[(finding['ruleId'], finding['subjectId'])] == finding['category'], 'finding category mismatch')
        for name, outcome in [('violations', 'violation'), ('incomplete', 'incomplete')]:
            subset = [f for f in findings if f['category'] == outcome]
            require(state['reportedOutcomes'][name] == {'ruleCount': len({f['ruleId'] for f in subset}), 'nodeCount': len(subset)}, 'finding counts mismatch')
        checks = state['manualChecks']
        require(len({c['checkId'] for c in checks}) == len(checks), 'duplicate manual check')
        total_pairs += len(pairs)
        total_findings += len(findings)
        total_manual += len(checks)
        total_nodes += sum(v['nodeCount'] for v in state['reportedOutcomes'].values())
    require(total_pairs <= 10000 and total_findings <= 10000 and total_nodes <= 10000, 'aggregate node/pair limit')
    require(total_manual <= 2000 and len(states) <= 50, 'aggregate manual/state limit')

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--schema', action='store_true')
    args = parser.parse_args()
    try:
        paths = sorted((ROOT / 'spec').glob('*.json')) + sorted((ROOT / 'fixtures/contract').glob('*.json')) + [ROOT / 'schemas/report-bundle.schema.json', ROOT / 'docs/PROGRESS.json']
        for path in paths:
            json.loads(path.read_text(encoding='utf-8'))
        routes = load('spec/routes.json')['routes']
        require(len(routes) == 15 and len({r['path'] for r in routes}) == 15, 'expected 15 unique routes')
        require(sum(r['path'].startswith('/guides/') for r in routes) == 6, 'expected 6 guides')
        require(sum(r['path'].startswith('/patterns/') for r in routes) == 3, 'expected 3 patterns')
        require(next(r for r in routes if r['path'] == '/workbench/')['eligibleAfterExplicitRelease'] is False, 'workbench must stay noindex')
        require(load('spec/routes.json')['defaultIndexable'] is False, 'indexing default must be off')
        state_items = load('spec/states.json')['states']
        require(len(state_items) == 9 and len({s['stateId'] for s in state_items}) == 9, 'expected nine states')
        require(all(s['sourceRoute'] in {r['path'] for r in routes} for s in state_items), 'missing state route')
        criteria = load('spec/acceptance.json')['criteria']
        require(len(criteria) == 26 and len({c['id'] for c in criteria}) == 26, 'expected 26 distinct acceptance IDs')
        require(all(c['status'] == 'NOT RUN' and not c['evidence'] for c in criteria), 'preparation must not claim app checks')
        prose = (ROOT / 'docs/ACCEPTANCE.md').read_text()
        require({c['id'] for c in criteria} == set(re.findall(r'^\| ((?:E2E|SEC|UX|PERF|SEO)-\d+) \|', prose, re.M)), 'acceptance prose/manifest mismatch')
        fixture_paths = sorted((ROOT / 'fixtures/contract').glob('*.json'))
        bundles = [p for p in fixture_paths if p.name != 'expected-comparison.json']
        require(len(bundles) == 7, 'expected seven hand-authored bundles')
        for path in bundles:
            validate_cross_fields(json.loads(path.read_text()))
        expected = load('fixtures/contract/expected-comparison.json')
        require(expected['counts'] == {'new': 1, 'persisting': 2, 'changed': 0, 'not-detected': 1, 'unassessable': 1}, 'independent oracle changed')
        baseline = load('fixtures/contract/baseline-v1.json')
        candidate = load('fixtures/contract/candidate-v1.json')
        require('menu.open' in {s['stateId'] for s in baseline['states']} and 'menu.open' not in {s['stateId'] for s in candidate['states']}, 'missing-state oracle changed')
        def has_pass(bundle, identity):
            return any(s['stateId'] == identity['stateId'] and any(p['ruleId'] == identity['ruleId'] and p['subjectId'] == identity['subjectId'] and p['outcome'] == 'pass' for p in s['capture']['evaluatedPairs']) for s in bundle['states'])
        require(has_pass(candidate, expected['identities']['F2']), 'F2 needs an exact candidate pass')
        require(has_pass(baseline, expected['identities']['F5']), 'F5 needs an exact baseline pass')
        require(not (ROOT / '.github/workflows').exists(), 'seed must not enable Actions')
        require('SITE_RELEASE_APPROVED=false' in (ROOT / '.env.example').read_text(), 'release default changed')
        print(f'PASS: preserved preparation contracts; {len(routes)} routes, {len(state_items)} states, {len(criteria)} acceptance snapshot entries, {len(bundles)} hand-authored bundles')
        if (ROOT / 'package.json').exists():
            print('Implementation is present. The preserved acceptance manifest is a contract snapshot; use docs/VERIFICATION.md and real npm checks for current evidence.')
        if args.schema:
            try:
                from jsonschema import Draft202012Validator, FormatChecker
            except ImportError:
                print('BLOCKED: --schema requires the already-installed jsonschema preparation dependency; nothing was installed.', file=sys.stderr)
                return 2
            schema = load('schemas/report-bundle.schema.json')
            Draft202012Validator.check_schema(schema)
            validator = Draft202012Validator(schema, format_checker=FormatChecker())
            for path in bundles:
                validator.validate(json.loads(path.read_text()))
            print('PASS: draft-2020-12 schema with explicit format checks; seven contract bundles validated')
        print('Application/browser/security/SEO/performance/human AT checks are not executed by this contract validator; see docs/VERIFICATION.md.')
        return 0
    except (ValueError, KeyError, OSError, StopIteration) as error:
        print(f'FAIL: preparation validation: {error}', file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())
