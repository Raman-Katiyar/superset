/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { GenericDataType } from '@apache-superset/core/common';
import { CurrencyFormatter, getNumberFormatter } from '@superset-ui/core';
import { ValueFormatterParams } from '@superset-ui/core/components/ThemedAgGridReact';
import { DataColumnMeta } from '@superset-ui/chart-controls';
import { formatColumnValue, valueFormatter } from './formatValue';
import { InputColumn } from '../types';

const makeColumn = (overrides: Partial<InputColumn> = {}): InputColumn =>
  ({
    key: 'metric',
    label: 'metric',
    dataType: GenericDataType.Numeric,
    isNumeric: true,
    isMetric: true,
    isPercentMetric: false,
    config: { d3SmallNumberFormat: '.2%' },
    formatter: getNumberFormatter(',.2f'),
    ...overrides,
  }) as InputColumn;

const makeParams = (value: unknown): ValueFormatterParams =>
  ({
    value,
    data: { metric: value },
  }) as unknown as ValueFormatterParams;

test('valueFormatter applies the small number format to values below one', () => {
  expect(valueFormatter(makeParams(0.1), makeColumn())).toBe('10.00%');
});

test('valueFormatter keeps the plain number format for values of one or more', () => {
  expect(valueFormatter(makeParams(1234.56), makeColumn())).toBe('1,234.56');
});

test('valueFormatter falls back to the plain formatter when no small number format is set', () => {
  const noSmallFormat = makeColumn({ config: {} });
  expect(valueFormatter(makeParams(0.1), noSmallFormat)).toBe('0.10');
  const emptySmallFormat = makeColumn({
    config: { d3SmallNumberFormat: '' },
  });
  expect(valueFormatter(makeParams(0.1), emptySmallFormat)).toBe('0.10');
  const nullSmallFormat = makeColumn({
    config: { d3SmallNumberFormat: null },
  });
  expect(valueFormatter(makeParams(0.1), nullSmallFormat)).toBe('0.10');
});

test('valueFormatter applies the small number format to negative small values', () => {
  expect(valueFormatter(makeParams(-0.1), makeColumn())).toBe('-10.00%');
});

test('valueFormatter matches formatColumnValue for small numbers', () => {
  const column = makeColumn();
  expect(formatColumnValue(column as unknown as DataColumnMeta, 0.1)[1]).toBe(
    '10.00%',
  );
  expect(valueFormatter(makeParams(0.1), column)).toBe('10.00%');
});

test('valueFormatter applies the small number format to currency columns', () => {
  const currencyColumn = makeColumn({
    formatter: new CurrencyFormatter({
      d3Format: '$,.2f',
      currency: { symbol: 'USD', symbolPosition: 'prefix' },
    }),
    config: {
      d3SmallNumberFormat: '.2%',
      currencyFormat: { symbol: 'USD', symbolPosition: 'prefix' },
    },
  });
  expect(
    formatColumnValue(currencyColumn as unknown as DataColumnMeta, 0.1)[1],
  ).toBe('$ 10.00');
  expect(valueFormatter(makeParams(0.1), currencyColumn)).toBe('$ 10.00');
});
