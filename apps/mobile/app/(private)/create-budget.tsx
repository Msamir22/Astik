/**
 * Create/Edit Budget Screen
 *
 * Route page for creating a new budget or editing an existing one.
 * When `id` query param is present, loads budget for edit mode.
 *
 * @module create-budget
 */

import { PageHeader } from "@/components/navigation/PageHeader";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Budget } from "@monyvi/db";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getBudgetById } from "@/services/budget-service";
import { logger } from "@/utils/logger";

// =============================================================================
// Screen
// =============================================================================

export default function CreateBudgetScreen(): React.JSX.Element {
  const { t } = useTranslation("budgets");

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [budget, setBudget] = useState<Budget | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    const budgetId = id;

    async function loadBudget(): Promise<void> {
      try {
        const found = await getBudgetById(budgetId);
        setBudget(found);
      } catch (error) {
        // WatermelonDB .find() throws when record not found.
        // Distinguish "not found" from unexpected errors.
        const message = error instanceof Error ? error.message : String(error);
        const isNotFound =
          message.includes("not found") || message.includes("Could not find");

        if (!isNotFound) {
          logger.error("createBudget.loadBudget.failed", error);
          setLoadError(t("load_budget_error"));
        }
        // If not found, budget stays undefined → BudgetForm renders in create mode
      } finally {
        setIsLoading(false);
      }
    }

    void loadBudget();
  }, [id, t]);

  return (
    <View className="flex-1">
      <PageHeader
        title={isEdit ? t("edit_budget") : t("new_budget")}
        showBackButton={true}
        showDrawer={false}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <View className="w-full px-6">
            <Skeleton width="100%" height={48} borderRadius={8} />
            <Skeleton
              width="72%"
              height={18}
              borderRadius={6}
              style={{ marginTop: 24 }}
            />
            <Skeleton
              width="100%"
              height={52}
              borderRadius={8}
              style={{ marginTop: 12 }}
            />
            <Skeleton
              width="72%"
              height={18}
              borderRadius={6}
              style={{ marginTop: 24 }}
            />
            <Skeleton
              width="100%"
              height={52}
              borderRadius={8}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-red-500 text-center">
            {loadError}
          </Text>
        </View>
      ) : (
        <BudgetForm existingBudget={budget} />
      )}
    </View>
  );
}
