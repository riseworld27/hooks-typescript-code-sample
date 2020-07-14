import React, { useRef } from 'react';
import { IForm, IField, IObject } from '../../types';
import Form from '../Form';
import { setupNavigationOptions } from '../../util/routing';
import {
  NavigationStackScreenOptions,
  NavigationScreenComponent
} from 'react-navigation';
import Header from '../../components/Header';
import { useNavigation, useNavigationEffect } from '../../util/navigation';
import { toKeyFromId } from '../../util/id';
import {
  editFormThrottled,
  forcePersistForm,
  completeForm
} from '../../service/sync';
import deepmerge from 'deepmerge';
import { useAppContext } from '../../util/appContext';

export interface IFormWrapperNavParams {
  form: IForm;
}

const getParams = (
  maybeParams: IFormWrapperNavParams | undefined
): IFormWrapperNavParams => {
  if (!maybeParams) {
    throw new Error('No params');
  }
  return maybeParams;
};

const FormWrapper: NavigationScreenComponent<IFormWrapperNavParams> = () => {
  const navigation = useNavigation<IFormWrapperNavParams>();
  const [, dispatcher] = useAppContext();
  const { form } = getParams(navigation.state.params);
  const { template } = form;

  const initialValues = useRef<IObject>();
  if (!initialValues.current) {
    initialValues.current = deepmerge({}, form.values);
  }

  useNavigationEffect(navigation, 'willBlur', async () => {
    const newForms = await forcePersistForm(form);
    dispatcher({
      forms: newForms
    });
  });

  const onFieldChange = (field: IField, value: unknown) => {
    const key = toKeyFromId(field.id);
    form.values[key] = value;
    editFormThrottled(form);
  };

  const onComplete = async () => {
    const newForms = await completeForm(form);
    dispatcher({
      forms: newForms
    });
  };

  return (
    <Form
      owner={form}
      template={template}
      onFieldChange={onFieldChange}
      initialValues={initialValues.current}
      onComplete={onComplete}
    />
  );
};

setupNavigationOptions<NavigationStackScreenOptions, IFormWrapperNavParams>(
  FormWrapper,
  navigation => {
    const { form } = getParams(navigation.state.params);
    return {
      header: ({ navigation: nav }) => (
        <Header
          navigation={nav}
          title={form.template.label}
          backAction={n => {
            n.navigate('Main');
          }}
        />
      )
    };
  }
);

export default FormWrapper;
