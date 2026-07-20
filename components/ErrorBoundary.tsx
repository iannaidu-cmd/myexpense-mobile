import * as Sentry from "@sentry/react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { colour, space, typography } from "@/tokens";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: space.xxxl, backgroundColor: colour.background }}>
        <Text style={{ ...typography.h3, color: colour.text, textAlign: "center", marginBottom: space.md }}>
          Something went wrong
        </Text>
        <Text style={{ ...typography.bodyM, color: colour.textSub, textAlign: "center", marginBottom: space.xxl }}>
          Please try again. If the problem persists, contact support.
        </Text>
        <TouchableOpacity
          onPress={() => this.setState({ hasError: false })}
          style={{ backgroundColor: colour.primary, borderRadius: 12, paddingHorizontal: space.xxl, paddingVertical: space.md }}
        >
          <Text style={{ ...typography.labelM, color: colour.white }}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
