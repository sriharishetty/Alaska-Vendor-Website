import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneDropdown
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPPermission } from '@microsoft/sp-page-context';

import * as strings from 'ProductionOperationsConnectWebPartStrings';
import ProductionOperationsSpfxShell from './components/ProductionOperationsSpfxShell';

export interface IProductionOperationsConnectWebPartProps {
  siteUrl: string;
  defaultView: string;
  enableSharePointLists: boolean;
}

export default class ProductionOperationsConnectWebPart extends BaseClientSideWebPart<IProductionOperationsConnectWebPartProps> {

  public render(): void {
    const pageContext = this.context?.pageContext;
    const currentUser = {
      displayName: pageContext?.user?.displayName || 'SharePoint User',
      email: pageContext?.user?.email || pageContext?.user?.loginName || '',
      loginName: pageContext?.user?.loginName || '',
      isSiteAdmin: Boolean(
        pageContext?.legacyPageContext?.isSiteAdmin ||
        pageContext?.web?.permissions?.hasPermission(SPPermission.manageWeb)
      ),
      canEditItems: Boolean(
        pageContext?.web?.permissions?.hasPermission(SPPermission.editListItems)
      )
    };

    const effectiveSiteUrl =
      this.properties.siteUrl ||
      pageContext?.web?.absoluteUrl ||
      '';

    const element: React.ReactElement = React.createElement(
      ProductionOperationsSpfxShell,
      {
        spfxContext: this.context,
        spHttpClient: this.context?.spHttpClient,
        siteUrl: effectiveSiteUrl,
        currentUser,
        defaultView: this.properties.defaultView || 'home',
        enableSharePointLists: Boolean(this.properties.enableSharePointLists)
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('siteUrl', {
                  label: 'SharePoint Site URL (optional override)',
                  description: 'Leave blank to automatically use the current SharePoint site context.'
                }),
                PropertyPaneDropdown('defaultView', {
                  label: 'Default Landing View',
                  options: [
                    { key: 'home', text: 'Home Dashboard' },
                    { key: 'vendors', text: 'Vendors & Partners (37 Records)' },
                    { key: 'vendor-maintenance', text: 'Vendor Maintenance' },
                    { key: 'vendor-case-status', text: 'Vendor Case Status' },
                    { key: 'categories', text: 'System Categories' },
                    { key: 'ground-stops', text: 'Operations Directory (Ground Stops)' },
                    { key: 'favorites', text: 'My Favorites' },
                    { key: 'reports', text: 'Reports & Analytics' },
                    { key: 'admin', text: 'Admin Settings' }
                  ]
                }),
                PropertyPaneToggle('enableSharePointLists', {
                  label: 'Connect to Live SharePoint Lists',
                  onText: 'Connected (SharePoint REST API)',
                  offText: 'Baseline Mode (37 Vendors & 10 Apps Built-in)'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}

