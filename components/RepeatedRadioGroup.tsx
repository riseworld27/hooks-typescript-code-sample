import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Subheading, List } from 'react-native-paper';
import Collapsible from 'react-native-collapsible';

import { ILookupItem, IValueOptions } from '../types';
import { last } from '../util/array';
import RadioWithLabel from './RadioWithLabel';
import RadioButtonGroup from './RadioButtonGroup';
import { shallowEquals } from '../util/object';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cell: {
    flex: 1
  },
  itemRow: {
    flex: 1,
    flexDirection: 'row'
  },
  itemLabel: {
    width: '30%',
  },
  topLabel: {
    fontWeight: '600'
  },
  iconWrapper: {
    marginRight: 12,
    width: 24,
    height: 24
  },
  icon: {
    margin: 0,
    width: 24,
    height: 24 
  }
});

interface IRepeatedRadioGroupProps {
  label?: string;
  options: ILookupItem[];
  items: ILookupItem[];
  value: IValueOptions;
  onChange: (value: IValueOptions) => void;
}

const all = 'all';
const headerRow = '___header___';
const empty = {};

const RepeatedRadioGroup: React.FunctionComponent<IRepeatedRadioGroupProps> = ({
  label,
  options,
  items,
  value,
  onChange
}: IRepeatedRadioGroupProps) => {
  const valueEntries = Object.entries(value || empty);
  const lastOption = last(options);
  if (!lastOption) {
    return null;
  }

  const [collapsed, setCollapsed] = useState(true);

  const allOption = lastOption;
  const allOptionId = allOption.id.toString();

  const allSelected =
    valueEntries.length === items.length &&
    valueEntries.every(([_, v]) => v === allOptionId);

  const onAllSelected = useCallback(() => {
    onChange(
      items.reduce((o, key) => {
        o[key.id.toString()] = allOptionId;
        return o;
      }, {} as IValueOptions)
    );
  }, [items, onChange]);

  const setValue = useMemo(
    () => (itemId: number, valueId: string) => {
      // Loop itemsEntries to ensure we retain order
      onChange(
        items.reduce((o, key) => {
          o[key.id] = key.id === itemId ? valueId : value[key.id] || '';
          return o;
        }, {} as IValueOptions)
      );
    },
    [onChange, value]
  );

  return (
    <View>
      <TouchableOpacity
        onPress={() => setCollapsed(!collapsed)}
        style={styles.row}
        key={headerRow}
      >
        <Subheading style={styles.itemLabel}>{label}</Subheading>
        {options.slice(0, -1).map(option => (
          <View style={styles.cell} key={option.id} />
        ))}
        <View style={styles.cell}>
          <RadioButtonGroup
            value={allSelected ? all : ''}
            onValueChange={onAllSelected}
          >
            <RadioWithLabel
              label={allOption.label}
              value={all}
              labelStyle={styles.topLabel}
            />
          </RadioButtonGroup>
        </View>
        <View style={styles.iconWrapper}>
          <List.Icon
            style={styles.icon}
            icon={collapsed ? 'chevron-up' : 'chevron-down'}
          />
        </View>
      </TouchableOpacity>
      <Collapsible collapsed={collapsed} align="center">
        {items.map(item => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <View style={styles.itemRow}>
              <RadioButtonGroup
                value={value[item.id] || ''}
                onValueChange={value => {
                  setValue(item.id, value);
                }}
              >
                {options.map(option => (
                  <View key={option.id} style={styles.cell}>
                    <RadioWithLabel
                      label={option.label}
                      value={option.id.toString()}
                    />
                  </View>
                ))}
              </RadioButtonGroup>
            </View>
            <View style={styles.iconWrapper} />
          </View>
        ))}
      </Collapsible>
    </View>
  );
};

export default React.memo(
  RepeatedRadioGroup,
  (prevProps, nextProps) =>
    prevProps.label === nextProps.label &&
    prevProps.options === nextProps.options &&
    shallowEquals(prevProps.value, nextProps.value) &&
    shallowEquals(prevProps.items, nextProps.items) &&
    prevProps.onChange === nextProps.onChange
);
